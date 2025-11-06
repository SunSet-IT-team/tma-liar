import type { Player } from './entities/player.entity';
import type { Settings } from './entities/settings.entity';

export interface LobbyApiFindLobbyParams {
  id?: number;
  lobbyCode: string;
}

export interface LobbyApiFindLobbiesParams {
  ids: number[];
}

export interface LobbyApiCreateLobbyParams {
  status: 'waiting';
  players?: Player[];
  admin?: number;
  settings: Settings;
  currentScreen: 'lobby';
}

export interface LobbyApiUpdateLobbyParams {
  id: number;
  nickname?: string;
  profileImg?: string;
}

export interface LobbyApiDeleteLobbyParams {
  id: number;
}
