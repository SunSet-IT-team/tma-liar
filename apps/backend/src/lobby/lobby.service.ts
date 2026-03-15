import { customAlphabet } from 'nanoid';
import { type Lobby } from './entities/lobby.entity';
import { ApiError } from '../common/response';
import type { CreateLobbyDto } from './dtos/lobby-create.dto';
import type { JoinLobbyDto } from './dtos/lobby-join.dto';
import type { FindLobbyDto } from './dtos/lobby-find.dto';
import type { UpdateLobbyDto } from './dtos/lobby-update.dto';
import type { DeleteLobbyDto } from './dtos/lobby-delete.dto';
import type { ToggleReadyDto } from './dtos/lobby-toggleReady.dto';
import { env } from '../config/env';
import { LobbyStatus, type Lobby as LobbyEntity } from './entities/lobby.entity';
import { LobbyRepository } from './lobby.repository';

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
  leaveLobby: (param: { lobbyCode: string; userId: string }) => Promise<{
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
  constructor(private readonly lobbyRepository: LobbyRepository = new LobbyRepository()) {}

  private isValidLoserTask(task: string | null | undefined): boolean {
    if (typeof task !== 'string') return false;
    const normalized = task.trim();
    if (!normalized) return false;
    if (normalized.toLowerCase() === 'task') return false;
    return true;
  }

  /** Найти одно лобби */
    public async findLobby(param: FindLobbyDto): Promise<Lobby> {
      const lobby = await this.lobbyRepository.findByCodeDocument(param.lobbyCode);

      if (!lobby) {
        throw new ApiError(404, 'LOBBY_NOT_FOUND');
      }

      return lobby.toObject();
    }

  /** Найти несколько лобби */
  public async findLobbies(): Promise<Lobby[]> {
    const lobbies = await this.lobbyRepository.findAll();

    if (!lobbies || lobbies.length === 0) throw new ApiError(404, 'LOBBIES_NOT_FOUND');
    return lobbies;
  }

  /** Создать лобби */
  public async createLobby( param: CreateLobbyDto): Promise<Lobby> {
    const lobby = await this.lobbyRepository.create({
      lobbyCode: nanoid6(),
      ...param
    });

    if (!lobby) throw new ApiError(400, 'LOBBY_NOT_CREATED');
    return lobby;
  }

  /** Обновить лобби */
  public async updateLobby(param: UpdateLobbyDto): Promise<Lobby> {
    let dtoToSave: UpdateLobbyDto = { ...param };

    if (param.status === LobbyStatus.WAITING && param.currentGameId === null && !param.players) {
      const currentLobby = await this.lobbyRepository.findByCode(param.lobbyCode);
      if (!currentLobby) {
        throw new ApiError(404, 'LOBBY_NOT_EXIST');
      }

      dtoToSave = {
        ...dtoToSave,
        players: currentLobby.players.map((player) => ({
          ...player,
          inGame: false,
          isReady: false,
        })),
      };
    }

    const updatedLobby = await this.lobbyRepository.updateByCode(dtoToSave);

    if (!updatedLobby) {
      throw new ApiError(404, 'LOBBY_NOT_EXIST');
    }

    return updatedLobby;
  }

  /** Удалить лобби */
  public async deleteLobby(param: DeleteLobbyDto): Promise<Lobby> {
    const deletedLobby = await this.lobbyRepository.deleteByCode(param.lobbyCode);

    if (!deletedLobby) {
      throw new ApiError(404, 'LOBBY_NOT_EXIST');
    }

    return deletedLobby;
  }

  /** Присоединиться к лобби */
  public async joinLobby(param: JoinLobbyDto): Promise<Lobby> {
    const updatedLobby = await this.lobbyRepository.joinIfAllowed(param);

    if (updatedLobby) {
      return updatedLobby;
    }

    const lobby = await this.lobbyRepository.findByCode(param.lobbyCode);
    if (!lobby) throw new ApiError(404, 'LOBBY_NOT_EXIST');

    if (lobby.status !== LobbyStatus.WAITING && lobby.status !== LobbyStatus.STARTED) {
      throw new ApiError(409, 'LOBBY_ALREADY_STARTED');
    }

    const exists = lobby.players.some((p) => p.telegramId === param.player.telegramId);
    if (exists) throw new ApiError(409, 'PLAYER_ALREADY_IN_LOBBY');

    throw new ApiError(409, 'LOBBY_JOIN_CONFLICT');
  }

  /** Переключить готовность игрока */
  public async togglePlayerReady(param: ToggleReadyDto): Promise<Lobby> {    
    const { lobbyCode, playerId, loserTask } = param;

    const lobby = await this.lobbyRepository.findByCode(lobbyCode);
    if (!lobby) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    const player = lobby.players.find((p) => {
      const rawId =
        p && typeof p === 'object' && '_id' in p && p._id
          ? String((p as { _id: unknown })._id)
          : null;
      return p.telegramId === playerId || p.id === playerId || rawId === playerId;
    });
    if (!player) {
      throw new ApiError(404, 'USER_NOT_FOUND_OR_LOBBY_EMPTY', {
        lobbyCode,
        playerId,
        lobbyPlayers: lobby.players.map((p) => ({
          telegramId: p.telegramId,
          id: p.id ?? null,
          _id:
            p && typeof p === 'object' && '_id' in p && p._id
              ? String((p as { _id: unknown })._id)
              : null,
        })),
      });
    }

    const playerTelegramId = player.telegramId;

    if (player.isReady === true) {
      const updatedLobby = await this.lobbyRepository.setPlayerNotReady(lobbyCode, playerTelegramId);

      if (!updatedLobby) throw new ApiError(409, 'READY_STATE_CONFLICT');
      return updatedLobby;
    }

    if (!this.isValidLoserTask(loserTask)) throw new ApiError(422, 'LOSER_TASK_NOT_SET');
    const normalizedLoserTask = (loserTask as string).trim();

    const updatedLobby = await this.lobbyRepository.setPlayerReady(
      lobbyCode,
      playerTelegramId,
      normalizedLoserTask,
    );

    if (!updatedLobby) throw new ApiError(409, 'READY_STATE_CONFLICT');
    return updatedLobby;
  }

  /** Игрок выходит из лобби с атомарным обновлением админа/удалением лобби. userId — серверный id или telegramId (гости). */
  public async leaveLobby(param: { lobbyCode: string; userId: string }): Promise<{
    lobby: LobbyEntity | null;
    deleted: boolean;
    newAdminId: string | null;
  }> {
    const { lobbyCode, userId } = param;
    const session = await this.lobbyRepository.startSession();
    const runWithoutTransaction = async () => {
      const lobbySnap = await this.lobbyRepository.findByCode(lobbyCode);

      if (!lobbySnap) {
        throw new ApiError(404, 'LOBBY_NOT_FOUND');
      }

      const isAdmin = lobbySnap.adminId === userId;
      const updatedLobby = await this.lobbyRepository.removePlayer(lobbyCode, userId);

      if (!updatedLobby) {
        throw new ApiError(404, 'PLAYER_NOT_IN_LOBBY');
      }

      if (updatedLobby.players.length === 0) {
        await this.lobbyRepository.deleteByCode(lobbyCode);
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

      if (lobbySnap.status === LobbyStatus.STARTED && lobbySnap.currentGameId) {
        const nextAdmin = updatedLobby.players[0];
        if (!nextAdmin) {
          throw new ApiError(500, 'NEXT_ADMIN_NOT_FOUND');
        }

        const nextAdminId = nextAdmin.id ?? nextAdmin.telegramId;
        const transferredLobby = await this.lobbyRepository.transferAdmin(
          lobbyCode,
          userId,
          nextAdminId,
        );
        if (!transferredLobby) throw new ApiError(409, 'ADMIN_TRANSFER_CONFLICT');

        return {
          lobby: transferredLobby,
          deleted: false,
          newAdminId: nextAdminId,
        };
      }

      await this.lobbyRepository.deleteByCode(lobbyCode);
      return {
        lobby: null,
        deleted: true,
        newAdminId: null,
      };
    };

    try {
      return await session.withTransaction(async () => {
        const lobbySnap = await this.lobbyRepository.findByCode(lobbyCode, session);

        if (!lobbySnap) {
          throw new ApiError(404, 'LOBBY_NOT_FOUND');
        }

        const isAdmin = lobbySnap.adminId === userId;
        const updatedLobby = await this.lobbyRepository.removePlayer(lobbyCode, userId, session);

        if (!updatedLobby) {
          throw new ApiError(404, 'PLAYER_NOT_IN_LOBBY');
        }

        if (updatedLobby.players.length === 0) {
          await this.lobbyRepository.deleteByCode(lobbyCode, session);
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

        if (lobbySnap.status === LobbyStatus.STARTED && lobbySnap.currentGameId) {
          const nextAdmin = updatedLobby.players[0];
          if (!nextAdmin) {
            throw new ApiError(500, 'NEXT_ADMIN_NOT_FOUND');
          }

          const nextAdminId = nextAdmin.id ?? nextAdmin.telegramId;
          const transferredLobby = await this.lobbyRepository.transferAdmin(
            lobbyCode,
            userId,
            nextAdminId,
            session,
          );
          if (!transferredLobby) throw new ApiError(409, 'ADMIN_TRANSFER_CONFLICT');

          return {
            lobby: transferredLobby,
            deleted: false,
            newAdminId: nextAdminId,
          };
        }

        await this.lobbyRepository.deleteByCode(lobbyCode, session);
        return {
          lobby: null,
          deleted: true,
          newAdminId: null,
        };
      }) as {
        lobby: LobbyEntity | null;
        deleted: boolean;
        newAdminId: string | null;
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const unsupportedTransactions =
        message.includes('Transaction numbers are only allowed on a replica set member or mongos') ||
        message.includes('does not support retryable writes');

      if (!unsupportedTransactions) {
        throw error;
      }

      return runWithoutTransaction();
    } finally {
      await session.endSession();
    }
  }
}
