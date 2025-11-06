import { nanoid } from 'nanoid';

import type {
  LobbyApiFindLobbyParams,
  LobbyApiFindLobbiesParams,
  LobbyApiCreateLobbyParams,
  LobbyApiUpdateLobbyParams,
  LobbyApiDeleteLobbyParams,
} from './lobby.params';
import type { Lobby } from './entities/lobby.entity';

/**
 * Интерфейс для API лобби
 */
export interface LobbyApiMethods {
  findLobby: (param: LobbyApiFindLobbyParams) => Promise<Lobby | null>;
  findLobbies: (param?: LobbyApiFindLobbiesParams) => Promise<Lobby[] | []>;
  createLobby: (param: LobbyApiCreateLobbyParams) => Promise<Lobby | null>;
  updateLobby: (param: LobbyApiUpdateLobbyParams) => Promise<Lobby | null>;
  deleteLobby: (param: LobbyApiDeleteLobbyParams) => Promise<Lobby>;
}

/**
 * API для лобби
 */
export class LobbyApi implements LobbyApiMethods {
  lobbies = new Map<number, Lobby>();

  public async findLobby(param?: LobbyApiFindLobbyParams): Promise<Lobby | null> {
    return new Promise((resolve, reject) => {
      // Поиск по id
      if (param?.id) {
        try {
          resolve(this.lobbies.get(param.id) || null);
        } catch (err) {
          reject(err);
        }
      }
      // Поиск по lobbyCode
      if (param?.lobbyCode) {
        try {
          for (let [key, value] of this.lobbies) {
            if (value.lobbyCode && value.lobbyCode == param.lobbyCode) {
              resolve({ ...value } as Lobby);
            }
          }
        } catch (err) {
          reject(err);
        }
      }
      resolve(null);
    });
  }

  public findLobbies(param?: LobbyApiFindLobbiesParams): Promise<Lobby[] | []> {
    return new Promise((resolve, reject) => {
      // поиск колод по id
      if (param?.ids) {
        const lobbyIds = param.ids;
        let lobbiesArray: Lobby[] = [];
        try {
          for (let key of lobbyIds) {
            const lobby = this.lobbies.get(key);
            if (lobby) {
              lobbiesArray.push(lobby);
            }
          }
          resolve(lobbiesArray);
        } catch (err) {
          reject(err);
        }
      }
      resolve([]);
    });
  }

  public createLobby(param: LobbyApiCreateLobbyParams): Promise<Lobby | null> {
    return new Promise((resolve, reject) => {
      try {
        const newLobbyId = this.lobbies.size + 1;
        this.lobbies.set(newLobbyId, {
          id: newLobbyId,
          ...param,
          status: 'waiting',
          currentScreen: 'lobby',
          lobbyCode: nanoid(6),
        } as Lobby);
        resolve(this.lobbies.get(newLobbyId) || null);
      } catch (err) {
        reject(err);
      }
    });
  }

  public updateLobby(param?: LobbyApiUpdateLobbyParams): Promise<Lobby | null> {
    return new Promise((resolve, reject) => {
      try {
        if (param?.id && this.lobbies.get(param?.id)) {
          const lobbyToUpdate = this.lobbies.get(param.id);
          if (lobbyToUpdate) {
            this.lobbies.set(param.id, {
              ...lobbyToUpdate,
              ...(param as Lobby),
            });
          } else {
            reject('LOBBY_NOT_EXIST');
          }
          resolve(this.lobbies.get(param.id) || null);
        } else {
          reject('LOBBY_ID_NOT_SET');
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  public deleteLobby(param?: LobbyApiDeleteLobbyParams): Promise<Lobby> {
    return new Promise((resolve, reject) => {
      try {
        if (param?.id && this.lobbies.get(param?.id)) {
          const lobbyToDelete = this.lobbies.get(param?.id);
          if (this.lobbies.delete(param.id)) {
            resolve(lobbyToDelete!);
          } else {
            reject('LOBBY_NOT_EXIST');
          }
        } else {
          reject('LOBBY_ID_NOT_SET');
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}
