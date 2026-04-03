import type { ClientSession } from 'mongoose';
import { LobbyModel } from './lobby.model';
import type { Lobby } from './entities/lobby.entity';
import { LobbyStatus } from './entities/lobby.entity';
import type { CreateLobbyDto } from './dtos/lobby-create.dto';
import type { UpdateLobbyDto } from './dtos/lobby-update.dto';
import type { JoinLobbyDto } from './dtos/lobby-join.dto';

export class LobbyRepository {
  public startSession() {
    return LobbyModel.startSession();
  }

  /**
   * Removes players from all lobbies to satisfy unique index constraints (`players.id`, `players.telegramId`).
   * This is used when a user creates or joins a lobby: the user must not exist in multiple lobbies.
   */
  public async evictPlayersFromAllLobbies(
    players: Array<{ id: string; telegramId: string }>,
    exceptLobbyCode?: string,
    session?: ClientSession,
  ): Promise<void> {
    if (!players || players.length === 0) return;

    // На случай "битых" игроков/пейлоадов:
    // не включаем null/empty в списки совпадений, но зато чистим null в целевых документах ниже.
    const ids = players.map((p) => p.id).filter((v) => typeof v === 'string' && v.trim().length > 0);
    const telegramIds = players
      .map((p) => p.telegramId)
      .filter((v) => typeof v === 'string' && v.trim().length > 0);

    const filter: Record<string, unknown> = {
      $or: [
        { 'players.id': { $in: ids } },
        { 'players.telegramId': { $in: telegramIds } },
      ],
      ...(exceptLobbyCode ? { lobbyCode: { $ne: exceptLobbyCode } } : {}),
    };

    await LobbyModel.updateMany(
      filter,
      {
        $pull: {
          players: {
            // Пуллим "пересекающего" игрока(ов) и дополнительно чистим corrupted subdocs
            // с null/empty telegramId, чтобы не ловить уникальный индекс `players.telegramId`.
            $or: [
              { id: { $in: ids } },
              { telegramId: { $in: telegramIds } },
              { telegramId: null },
              { id: null },
            ],
          },
        },
      },
      { session },
    );
  }

  public async findByCode(lobbyCode: string, session?: ClientSession): Promise<Lobby | null> {
    const query = LobbyModel.findOne({ lobbyCode });
    if (session) query.session(session);
    const lobby = await query.lean();
    return (lobby as Lobby | null) ?? null;
  }

  /** Лобби, где есть игрок с данным id или telegramId (гость/серверный id). */
  public async findByPlayerUserId(userId: string, session?: ClientSession): Promise<Lobby | null> {
    const query = LobbyModel.findOne({
      $or: [{ 'players.id': userId }, { 'players.telegramId': userId }],
    });
    if (session) query.session(session);
    const lobby = await query.lean();
    return (lobby as Lobby | null) ?? null;
  }

  public async findByCodeDocument(lobbyCode: string, session?: ClientSession) {
    const query = LobbyModel.findOne({ lobbyCode });
    if (session) query.session(session);
    return query;
  }

  public async findAll(): Promise<Lobby[]> {
    const lobbies = await LobbyModel.find().lean();
    return lobbies as Lobby[];
  }

  public async create(dto: CreateLobbyDto & { lobbyCode: string }): Promise<Lobby> {
    const lobby = await LobbyModel.create(dto);
    return lobby.toObject();
  }

  public async updateByCode(dto: UpdateLobbyDto, session?: ClientSession): Promise<Lobby | null> {
    const { lobbyCode, ...updateFields } = dto;
    const updated = await LobbyModel.findOneAndUpdate(
      { lobbyCode },
      { $set: updateFields },
      { new: true, session }
    ).lean();

    return (updated as Lobby | null) ?? null;
  }

  public async markStartedIfWaiting(
    lobbyCode: string,
    currentGameId: string,
    session?: ClientSession,
  ): Promise<Lobby | null> {
    const updated = await LobbyModel.findOneAndUpdate(
      {
        lobbyCode,
        status: LobbyStatus.WAITING,
        currentGameId: null,
      },
      {
        $set: {
          status: LobbyStatus.STARTED,
          currentGameId,
        },
      },
      { new: true, session }
    ).lean();

    return (updated as Lobby | null) ?? null;
  }

  public async deleteByCode(lobbyCode: string, session?: ClientSession): Promise<Lobby | null> {
    const deleted = await LobbyModel.findOneAndDelete({ lobbyCode }, { session }).lean();
    return (deleted as Lobby | null) ?? null;
  }

  /** Не пускаем в лобби, если уже есть игрок с таким же id (серверный) или telegramId. */
  public async joinIfAllowed(dto: JoinLobbyDto): Promise<Lobby | null> {
    const updated = await LobbyModel.findOneAndUpdate(
      {
        lobbyCode: dto.lobbyCode,
        status: { $in: [LobbyStatus.WAITING, LobbyStatus.STARTED] },
        $nor: [
          { 'players.id': dto.player.id },
          { 'players.telegramId': dto.player.telegramId },
        ],
      },
      { $push: { players: dto.player } },
      { new: true }
    ).lean();

    return (updated as Lobby | null) ?? null;
  }

  public async setPlayerReady(
    lobbyCode: string,
    playerTelegramId: string,
    loserTask: string | null,
  ): Promise<Lobby | null> {
    const updated = await LobbyModel.findOneAndUpdate(
      {
        lobbyCode,
        players: { $elemMatch: { telegramId: playerTelegramId, isReady: { $ne: true } } },
      },
      {
        $set: {
          'players.$[target].isReady': true,
          'players.$[target].loserTask': loserTask,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'target.telegramId': playerTelegramId }],
      }
    ).lean();

    return (updated as Lobby | null) ?? null;
  }

  public async setPlayerNotReady(lobbyCode: string, playerTelegramId: string): Promise<Lobby | null> {
    const updated = await LobbyModel.findOneAndUpdate(
      {
        lobbyCode,
        players: { $elemMatch: { telegramId: playerTelegramId, isReady: true } },
      },
      {
        $set: {
          'players.$[target].isReady': false,
          'players.$[target].loserTask': null,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'target.telegramId': playerTelegramId }],
      }
    ).lean();

    return (updated as Lobby | null) ?? null;
  }

  /** Удаляет игрока по userId: серверный id или telegramId (гости/сокет шлёт по-разному). */
  public async removePlayer(lobbyCode: string, userId: string, session?: ClientSession): Promise<Lobby | null> {
    const updated = await LobbyModel.findOneAndUpdate(
      { lobbyCode },
      { $pull: { players: { $or: [{ id: userId }, { telegramId: userId }] } } },
      { new: true, session }
    ).lean();

    return (updated as Lobby | null) ?? null;
  }

  public async transferAdmin(
    lobbyCode: string,
    currentAdminId: string,
    nextAdminId: string,
    session?: ClientSession,
  ): Promise<Lobby | null> {
    const updated = await LobbyModel.findOneAndUpdate(
      { lobbyCode, adminId: currentAdminId },
      { $set: { adminId: nextAdminId } },
      { new: true, session }
    ).lean();

    return (updated as Lobby | null) ?? null;
  }

  public async updatePlayerProfileImg(telegramId: string, profileImg: string): Promise<void> {
    await LobbyModel.updateMany(
      { 'players.telegramId': telegramId },
      {
        $set: {
          'players.$[target].profileImg': profileImg,
        },
      },
      {
        arrayFilters: [{ 'target.telegramId': telegramId }],
      },
    );
  }
}
