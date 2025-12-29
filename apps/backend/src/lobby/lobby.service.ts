import { customAlphabet } from 'nanoid';
import type {
  LobbyApiFindLobbyParams,
  LobbyApiFindLobbiesParams,
  LobbyApiCreateLobbyParams,
  LobbyApiUpdateLobbyParams,
  LobbyApiDeleteLobbyParams,
  LobbyApiJoinParams,
  LobbyApiToggleReadyParams,
  LobbyApiStartGameParams,
} from './lobby.params';

import type { Lobby } from './entities/lobby.entity';
import { ApiError } from '../common/response';
import { LobbyModel } from './lobby.model';
import type { Player } from './entities/player.entity';
import { GameStages } from './entities/lobby.entity';
import { Game } from '../game/game.service';

/**
 * Интерфейс для API лобби
 */
export interface LobbyApiMethods {
  findLobby: (param?: LobbyApiFindLobbyParams) => Promise<Lobby | null>;
  findLobbies: (param?: LobbyApiFindLobbiesParams) => Promise<Lobby[] | []>;
  createLobby: (param: LobbyApiCreateLobbyParams) => Promise<Lobby>;
  updateLobby: (param: LobbyApiUpdateLobbyParams) => Promise<Lobby>;
  deleteLobby: (param: LobbyApiDeleteLobbyParams) => Promise<Lobby>;
  joinLobby: (param: LobbyApiJoinParams) => Promise<Lobby>;
  togglePlayerReady: (param: LobbyApiToggleReadyParams) => Promise<Lobby>;
  startGame: (param: LobbyApiStartGameParams) => Promise<Lobby>;
}

const nanoid6 = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);
const game = new Game();

/**
 * API для лобби
 */
export class LobbyApi implements LobbyApiMethods {
   
  public async findLobby(param?: LobbyApiFindLobbyParams): Promise<Lobby | null> {
    if (!param?.lobbyCode && !param?.lobbyCode) {
      throw new ApiError(400, 'LOBBY_ID_OR_CODE_NOT_SET');
    }

    return LobbyModel.findOne({ lobbyCode: param.lobbyCode }).lean();
  }

  public async findLobbies(param?: LobbyApiFindLobbiesParams): Promise<Lobby[] | []> {
    if (!param?.lobbyCodes || param.lobbyCodes.length === 0) throw new ApiError(404, 'LOBBY_CODES_NOT_SET');

    return LobbyModel.find({ lobbyCode: { $in: param.lobbyCodes } }).lean();
  }

  public async createLobby( param: LobbyApiCreateLobbyParams): Promise<Lobby> {
    if (!param.settings) {
      throw new ApiError(400, "SETTINGS_NOT_SET");
    }

    if (!param.adminId) {
      throw new ApiError(400, "ADMIN_NOT_SET");
    }

    const { adminId, players, settings } = param;

    let lobbyCode: string;
    let exists: Lobby | null;
    do {
      lobbyCode = nanoid6();
      exists = await LobbyModel.findOne({ lobbyCode }).lean();
    } while (exists);

    const lobby: Lobby = {
      lobbyCode,
      status: 'waiting',
      stage: GameStages.LOBBY,
      players: players,
      adminId: adminId,
      questionHistory: [],
      activeQuestion: undefined,
      settings: settings,
      liarId: null,
      doLie: null, 
      timerId: null, 
      loserTask: null,
      winnerId: null, 
      loserId: null
    };

    return (await LobbyModel.create(lobby)).toObject();
  }


  public async updateLobby(param: LobbyApiUpdateLobbyParams): Promise<Lobby> {
    if (!param?.lobbyCode) {
      throw new ApiError(400, 'LOBBY_ID_OR_CODE_NOT_SET');
    }

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

  public async deleteLobby(param: LobbyApiDeleteLobbyParams): Promise<Lobby> {
    if (!param?.lobbyCode) {
      throw new ApiError(400, 'LOBBY_CODE_NOT_SET');
    }

    const deletedLobby = await LobbyModel
      .findOneAndDelete({ lobbyCode: param.lobbyCode })
      .lean();

    if (!deletedLobby) {
      throw new ApiError(400, 'LOBBY_NOT_EXIST');
    }

    return deletedLobby;
  }

  public async joinLobby(param?: LobbyApiJoinParams): Promise<Lobby> {
    if (!param?.lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');
    if (!param?.player) throw new ApiError(400, 'PLAYER_NOT_SET');

    param.player.isReady = false; 
    param.player.loserTask = null;

    const lobby = await LobbyModel.findOne({ lobbyCode: param.lobbyCode });

    if (!lobby) throw new ApiError(404, 'LOBBY_NOT_EXIST');

    const exists = lobby.players.find(p => p.telegramId === param.player.telegramId);
    if (exists) throw new ApiError(400, 'PLAYER_ALREADY_IN_LOBBY');

    (lobby.players as Player[]).push(param.player);

    await lobby.save();

    return lobby.toObject();
  }

  public async togglePlayerReady(param?: LobbyApiToggleReadyParams): Promise<Lobby> {    
    if (!param?.lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');
    if (!param?.telegramId) throw new ApiError(400, 'ADMIN_ID_NOT_SET');
    if (!param?.loserTask) throw new ApiError(400, 'LOSER_TASK_NOT_SET');

    const { lobbyCode, telegramId, loserTask } = param;

    const lobby = await LobbyModel.findOne({ lobbyCode });
    if (!lobby) throw new ApiError(404, "LOBBY_NOT_FOUND");

    const player = lobby.players?.find(p => p.telegramId === telegramId);

    if(!player) throw new ApiError(404, 'USER_NOT_FOUND_OR_LOBBY_EMPTY');

    if (player.isReady) {
      player.isReady = false;
      player.loserTask = null;
      player.wasLiar = 0;
    } else {
      if (!loserTask) throw new ApiError(400, "LOSER_TASK_NOT_SET");

      player.isReady = true;
      player.loserTask = loserTask;
    }

    lobby.markModified('players');

    const updatedLobby = await lobby.save();
    return updatedLobby.toObject();
  }  

  public async startGame(param?: LobbyApiStartGameParams): Promise<Lobby> {
    if (!param?.lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');
    if (!param?.telegramId) throw new ApiError(400, 'ADMIN_ID_NOT_SET');
    if (!param?.loserTask) throw new ApiError(400, 'LOSER_TASK_NOT_SET');

    const { lobbyCode, telegramId, loserTask } = param;

    const lobby = await LobbyModel.findOne({ lobbyCode });
    if (!lobby) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    if (lobby.adminId !== telegramId) throw new ApiError(403, 'ONLY_ADMIN_CAN_START_GAME');

    if (!lobby.players || lobby.players.length === 0) throw new ApiError(400, 'LOBBY_EMPTY');

    const notReadyPlayer = lobby.players.find(p => !p.isReady);
    if (notReadyPlayer) throw new ApiError(400, 'NOT_ALL_PLAYERS_READY');

    const admin = lobby.players.find(p => p.telegramId == telegramId);
    if(!admin) throw new ApiError(404, 'ADMIN_NOT_IN_LOBBY');

    admin.loserTask = loserTask;

    lobby.status = 'game';

    lobby.markModified('players');
    const updatedLobby = await lobby.save();

    game.nextStage({ lobbyCode: lobbyCode });

    return updatedLobby.toObject();
  }
}