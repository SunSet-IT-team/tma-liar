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

  public async findByCode(lobbyCode: string, session?: ClientSession): Promise<Lobby | null> {
    const query = LobbyModel.findOne({ lobbyCode });
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

  public async joinIfAllowed(dto: JoinLobbyDto): Promise<Lobby | null> {
    const updated = await LobbyModel.findOneAndUpdate(
      {
        lobbyCode: dto.lobbyCode,
        status: LobbyStatus.WAITING,
        currentGameId: null,
        'players.telegramId': { $ne: dto.player.telegramId },
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

  public async removePlayer(lobbyCode: string, telegramId: string, session?: ClientSession): Promise<Lobby | null> {
    const updated = await LobbyModel.findOneAndUpdate(
      {
        lobbyCode,
        'players.telegramId': telegramId,
      },
      { $pull: { players: { telegramId } } },
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
}
