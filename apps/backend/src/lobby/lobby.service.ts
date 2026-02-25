import { customAlphabet } from 'nanoid';
import { type Lobby } from './entities/lobby.entity';
import { ApiError } from '../common/response';
import { LobbyModel } from './lobby.model';
import type { CreateLobbyDto } from './dtos/lobby-create.dto';
import type { JoinLobbyDto } from './dtos/lobby-join.dto';
import type { FindLobbyDto } from './dtos/lobby-find.dto';
import type { UpdateLobbyDto } from './dtos/lobby-update.dto';
import type { DeleteLobbyDto } from './dtos/lobby-delete.dto';
import type { ToggleReadyDto } from './dtos/lobby-toggleReady.dto';
import { env } from '../config/env';
import { LobbyStatus, type Lobby as LobbyEntity } from './entities/lobby.entity';

const LOBBY_CODE_ALPHABET = env.LOBBY_CODE_ALPHABET;
const LOBBY_CODE_LENGTH = env.LOBBY_CODE_LENGTH;

/**
 * Интерфейс для сервиса лобби
 */
export interface LobbyServiceMethods {
  findLobby: (param: FindLobbyDto) => Promise<Lobby>;
  findLobbies: () => Promise<Lobby[]>;
  createLobby: (param: CreateLobbyDto) => Promise<Lobby>;
  updateLobby: (param: UpdateLobbyDto) => Promise<Lobby>;
  deleteLobby: (param: DeleteLobbyDto) => Promise<Lobby>;
  joinLobby: (param: JoinLobbyDto) => Promise<Lobby>;
  togglePlayerReady: (param: ToggleReadyDto) => Promise<Lobby>;
  leaveLobby: (param: { lobbyCode: string; telegramId: string }) => Promise<{
    lobby: LobbyEntity | null;
    deleted: boolean;
    newAdminId: string | null;
  }>;
}

const nanoid6 = customAlphabet(LOBBY_CODE_ALPHABET, LOBBY_CODE_LENGTH);
/**
 * Сервис лобби
 */
export class LobbyService implements LobbyServiceMethods {
  /** Найти одно лобби */
    public async findLobby(param: FindLobbyDto): Promise<Lobby> {
      const lobby = await LobbyModel.findOne({ lobbyCode: param.lobbyCode });

      if (!lobby) {
        throw new ApiError(404, 'LOBBY_NOT_FOUND');
      }

      return lobby.toObject();
    }

  /** Найти несколько лобби */
  public async findLobbies(): Promise<Lobby[]> {
    const lobbies = await LobbyModel.find().lean();

    if (!lobbies || lobbies.length === 0) throw new ApiError(404, 'LOBBIES_NOT_FOUND');
    return lobbies;
  }

  /** Создать лобби */
  public async createLobby( param: CreateLobbyDto): Promise<Lobby> {
    const lobby = await LobbyModel.create({
      lobbyCode: nanoid6(),
      ...param
    });

    if (!lobby) throw new ApiError(400, 'LOBBY_NOT_CREATED');
    return lobby.toObject();
  }

  /** Обновить лобби */
  public async updateLobby(param: UpdateLobbyDto): Promise<Lobby> {
    const { lobbyCode, ...updateFields } = param;

    const updatedLobby = await LobbyModel.findOneAndUpdate(
      { lobbyCode },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updatedLobby) {
      throw new ApiError(404, 'LOBBY_NOT_EXIST');
    }

    return updatedLobby;
  }

  /** Удалить лобби */
  public async deleteLobby(param: DeleteLobbyDto): Promise<Lobby> {
    const deletedLobby = await LobbyModel.findOneAndDelete({ lobbyCode: param.lobbyCode }).lean();

    if (!deletedLobby) {
      throw new ApiError(404, 'LOBBY_NOT_EXIST');
    }

    return deletedLobby;
  }

  /** Присоединиться к лобби */
  public async joinLobby(param: JoinLobbyDto): Promise<Lobby> {
    const updatedLobby = await LobbyModel.findOneAndUpdate(
      {
        lobbyCode: param.lobbyCode,
        status: LobbyStatus.WAITING,
        currentGameId: null,
        'players.telegramId': { $ne: param.player.telegramId },
      },
      { $push: { players: param.player } },
      { new: true }
    ).lean();

    if (updatedLobby) {
      return updatedLobby;
    }

    const lobby = await LobbyModel.findOne({ lobbyCode: param.lobbyCode }).lean();
    if (!lobby) throw new ApiError(404, 'LOBBY_NOT_EXIST');

    if (lobby.status !== LobbyStatus.WAITING || lobby.currentGameId !== null) {
      throw new ApiError(409, 'LOBBY_ALREADY_STARTED');
    }

    const exists = lobby.players.some((p) => p.telegramId === param.player.telegramId);
    if (exists) throw new ApiError(409, 'PLAYER_ALREADY_IN_LOBBY');

    throw new ApiError(409, 'LOBBY_JOIN_CONFLICT');
  }

  /** Переключить готовность игрока */
  public async togglePlayerReady(param: ToggleReadyDto): Promise<Lobby> {    
    const { lobbyCode, playerId, loserTask } = param;

    const lobby = await LobbyModel.findOne({ lobbyCode }).lean();
    if (!lobby) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    const player = lobby.players.find((p) => p.id === playerId);
    if (!player) throw new ApiError(404, 'USER_NOT_FOUND_OR_LOBBY_EMPTY');

    if (player.isReady === true) {
      const updatedLobby = await LobbyModel.findOneAndUpdate(
        {
          lobbyCode,
          players: { $elemMatch: { id: playerId, isReady: true } },
        },
        {
          $set: {
            'players.$[target].isReady': false,
            'players.$[target].loserTask': null,
          },
        },
        {
          new: true,
          arrayFilters: [{ 'target.id': playerId }],
        }
      ).lean();

      if (!updatedLobby) throw new ApiError(409, 'READY_STATE_CONFLICT');
      return updatedLobby;
    }

    if (!loserTask) throw new ApiError(422, 'LOSER_TASK_NOT_SET');

    const updatedLobby = await LobbyModel.findOneAndUpdate(
      {
        lobbyCode,
        players: { $elemMatch: { id: playerId, isReady: { $ne: true } } },
      },
      {
        $set: {
          'players.$[target].isReady': true,
          'players.$[target].loserTask': loserTask,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'target.id': playerId }],
      }
    ).lean();

    if (!updatedLobby) throw new ApiError(409, 'READY_STATE_CONFLICT');
    return updatedLobby;
  }

  /** Игрок выходит из лобби с атомарным обновлением админа/удалением лобби */
  public async leaveLobby(param: { lobbyCode: string; telegramId: string }): Promise<{
    lobby: LobbyEntity | null;
    deleted: boolean;
    newAdminId: string | null;
  }> {
    const { lobbyCode, telegramId } = param;
    const session = await LobbyModel.startSession();

    try {
      return await session.withTransaction(async () => {
        const lobbySnap = await LobbyModel.findOne({ lobbyCode }).session(session).lean();

        if (!lobbySnap) {
          throw new ApiError(404, 'LOBBY_NOT_FOUND');
        }

        const isAdmin = lobbySnap.adminId === telegramId;
        const updatedLobby = await LobbyModel.findOneAndUpdate(
          {
            lobbyCode,
            'players.telegramId': telegramId,
          },
          { $pull: { players: { telegramId } } },
          { new: true, session }
        ).lean();

        if (!updatedLobby) {
          throw new ApiError(404, 'PLAYER_NOT_IN_LOBBY');
        }

        if (updatedLobby.players.length === 0) {
          await LobbyModel.deleteOne({ lobbyCode }).session(session);
          return {
            lobby: null,
            deleted: true,
            newAdminId: null,
          };
        }

        if (!isAdmin) {
          return {
            lobby: updatedLobby,
            deleted: false,
            newAdminId: null,
          };
        }

        const firstPlayer = updatedLobby.players[0];
        if (!firstPlayer) {
          throw new ApiError(409, 'LOBBY_ADMIN_TRANSFER_CONFLICT');
        }

        const lobbyWithNewAdmin = await LobbyModel.findOneAndUpdate(
          { lobbyCode, adminId: telegramId },
          { $set: { adminId: firstPlayer.telegramId } },
          { new: true, session }
        ).lean();

        if (!lobbyWithNewAdmin) {
          throw new ApiError(409, 'LOBBY_ADMIN_TRANSFER_CONFLICT');
        }

        return {
          lobby: lobbyWithNewAdmin,
          deleted: false,
          newAdminId: firstPlayer.telegramId,
        };
      }) as {
        lobby: LobbyEntity | null;
        deleted: boolean;
        newAdminId: string | null;
      };
    } finally {
      await session.endSession();
    }
  }
}
