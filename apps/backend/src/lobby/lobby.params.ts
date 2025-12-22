import type { Player } from './entities/player.entity';
import type { Settings } from './entities/settings.entity';

export interface LobbyApiFindLobbyParams {
  lobbyCode: string;
}

export interface LobbyApiFindLobbiesParams {
  lobbyCodes: string[];
}

export interface LobbyApiCreateLobbyParams {
  players: Player[] | [];
  adminId: string;
  settings: Settings;
}

export interface LobbyApiUpdateLobbyParams {
  lobbyCode: string;
  players?: Player[];
  settings?: Settings;
  status?: 'waiting' | 'started' | 'finished';
  currentScreen?: 'lobby' | 'game' | 'result';
}
 
export interface LobbyApiDeleteLobbyParams {
  lobbyCode?: string;
}

export interface LobbyApiJoinParams { 
  lobbyCode: string;
  player: Player;
}

export interface LobbyApiToggleReadyParams {
  lobbyCode: string;
  telegramId: string;
  loserTask?: string;
}