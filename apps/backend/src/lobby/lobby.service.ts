import { customAlphabet } from 'nanoid';
import type {
  LobbyApiFindLobbyParams,
  LobbyApiFindLobbiesParams,
  LobbyApiCreateLobbyParams,
  LobbyApiUpdateLobbyParams,
  LobbyApiDeleteLobbyParams,
} from './lobby.params';

import type { Lobby } from './entities/lobby.entity';
import { ApiError } from '../common/response';
import { LobbyModel } from './lobby.modal';

/**
 * Интерфейс для API лобби
 */
export interface LobbyApiMethods {
  findLobby: (param?: LobbyApiFindLobbyParams) => Promise<Lobby | null>;
  findLobbies: (param?: LobbyApiFindLobbiesParams) => Promise<Lobby[] | []>;
  createLobby: (param: LobbyApiCreateLobbyParams) => Promise<Lobby>;
  updateLobby: (param: LobbyApiUpdateLobbyParams) => Promise<Lobby>;
  deleteLobby: (param: LobbyApiDeleteLobbyParams) => Promise<Lobby>;
}

const nanoid6 = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

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
      currentScreen: 'lobby',
      players: players,
      adminId: adminId,
      questionHistory: [],
      activeQuestion: undefined,
      settings: settings
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
}