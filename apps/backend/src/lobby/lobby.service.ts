import { customAlphabet } from 'nanoid';
import type {
  LobbyServiceFindLobbyParams,
  LobbyServiceFindLobbiesParams,
  LobbyServiceCreateLobbyParams,
  LobbyServiceUpdateLobbyParams,
  LobbyServiceDeleteLobbyParams,
  LobbyServiceJoinParams,
  LobbyServiceToggleReadyParams,
  LobbyServiceStartGameParams,
} from './lobby.params';

import { LobbyStatus, type Lobby } from './entities/lobby.entity';
import { ApiError } from '../common/response';
import { LobbyModel } from './lobby.model';
import type { Player } from './entities/player.entity';
import { GameService } from '../game/game.service';

/**
 * Интерфейс для сервиса лобби
 */
export interface LobbyServiceMethods {
  findLobby: (param: LobbyServiceFindLobbyParams) => Promise<Lobby>;
  findLobbies: (param: LobbyServiceFindLobbiesParams) => Promise<Lobby[]>;
  createLobby: (param: LobbyServiceCreateLobbyParams) => Promise<Lobby>;
  updateLobby: (param: LobbyServiceUpdateLobbyParams) => Promise<Lobby>;
  deleteLobby: (param: LobbyServiceDeleteLobbyParams) => Promise<Lobby>;
  joinLobby: (param: LobbyServiceJoinParams) => Promise<Lobby>;
  togglePlayerReady: (param: LobbyServiceToggleReadyParams) => Promise<Lobby>;
}

const nanoid6 = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

const gameService = new GameService();

/**
 * Сервис лобби
 */
export class LobbyService implements LobbyServiceMethods {
  /** Найти одно лобби */
  public async findLobby(param: LobbyServiceFindLobbyParams): Promise<Lobby> {
    const lobby = await LobbyModel.findOne({ lobbyCode: param.lobbyCode }).lean();

    if (!lobby) throw new ApiError(400, 'LOBBY_NOT_FOUND');

    return lobby;
  }

  /** Найти несколько лобби */
  public async findLobbies(param: LobbyServiceFindLobbiesParams): Promise<Lobby[] | []> {
    const lobbies = await LobbyModel.find({ lobbyCode: { $in: param.lobbyCodes } }).lean();

    if (!lobbies || lobbies.length === 0) throw new ApiError(400, 'LOBBIES_NOT_FOUND');
    return lobbies;
  }

  /** Создать лобби */
  public async createLobby( param: LobbyServiceCreateLobbyParams): Promise<Lobby> {
    const lobby = await LobbyModel.create({
      lobbyCode: nanoid6(),
      ...param
    });

    if (!lobby) throw new ApiError(400, 'LOBBY_NOT_CREATED');
    return lobby.toObject();
  }

  /** Обновить лобби */
  public async updateLobby(param: LobbyServiceUpdateLobbyParams): Promise<Lobby> {
    const { lobbyCode, ...updateFields } = param;

    const updatedLobby = await LobbyModel.findOneAndUpdate(
      { lobbyCode },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updatedLobby) {
      throw new ApiError(400, 'LOBBY_NOT_EXIST');
    }

    return updatedLobby;
  }

  /** Удалить лобби */
  public async deleteLobby(param: LobbyServiceDeleteLobbyParams): Promise<Lobby> {
    const deletedLobby = await LobbyModel.findOneAndDelete({ lobbyCode: param.lobbyCode }).lean();

    if (!deletedLobby) {
      throw new ApiError(400, 'LOBBY_NOT_EXIST');
    }

    return deletedLobby;
  }

  /** Присоединиться к лобби */
  public async joinLobby(param: LobbyServiceJoinParams): Promise<Lobby> {
    const lobby = await LobbyModel.findOne({ lobbyCode: param.lobbyCode });

    if (!lobby) throw new ApiError(404, 'LOBBY_NOT_EXIST');

    const exists = lobby.players.find(p => p.telegramId === param.player.telegramId);
    if (exists) throw new ApiError(400, 'PLAYER_ALREADY_IN_LOBBY');

    (lobby.players as Player[]).push(param.player);

    await lobby.save();

    return lobby.toObject();
  }

  /** Переключить готовность игрока */
  public async togglePlayerReady(param: LobbyServiceToggleReadyParams): Promise<Lobby> {    
    const { lobbyCode, telegramId, loserTask } = param;

    const lobby = await LobbyModel.findOne({ lobbyCode });
    if (!lobby) throw new ApiError(400, "LOBBY_NOT_FOUND");

    const player = lobby.players.find(p => p.telegramId === telegramId);

    if(!player) throw new ApiError(400, 'USER_NOT_FOUND_OR_LOBBY_EMPTY');

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