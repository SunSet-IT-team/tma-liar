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
    // Проверяем существование лобби и наличие игрока
    const existingLobby = await LobbyModel.findOne({ lobbyCode: param.lobbyCode }).lean();
    
    if (!existingLobby) throw new ApiError(404, 'LOBBY_NOT_EXIST');

    const exists = existingLobby.players.find(p => p.telegramId === param.player.telegramId);
    if (exists) throw new ApiError(409, 'PLAYER_ALREADY_IN_LOBBY');

    const updatedLobby = await LobbyModel.findOneAndUpdate(
      { lobbyCode: param.lobbyCode },
      { $push: { players: param.player } },
      { new: true }
    );

    console.log("updatedLobby", updatedLobby);
    if (!updatedLobby) {
      throw new ApiError(400, 'LOBBY_UPDATE_FAILED');
    }

    return updatedLobby.toObject();
  }

  /** Переключить готовность игрока */
  public async togglePlayerReady(param: ToggleReadyDto): Promise<Lobby> {    
    const { lobbyCode, playerId, loserTask } = param;

    const lobby = await LobbyModel.findOne({ lobbyCode });
    if (!lobby) throw new ApiError(400, "LOBBY_NOT_FOUND");

    const player = lobby.players.find(p => p.id === playerId);

    if(!player) throw new ApiError(404, 'USER_NOT_FOUND_OR_LOBBY_EMPTY');

    if (player.isReady) {
      player.isReady = false;
      player.loserTask = null;
    } else {
      if (!loserTask) throw new ApiError(400, "LOSER_TASK_NOT_SET");

      player.isReady = true;
      player.loserTask = loserTask;
    }

    const updatedLobby = await lobby.save();
    return updatedLobby.toObject();
  }  
}
