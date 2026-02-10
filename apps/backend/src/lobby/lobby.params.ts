import type { Player } from './entities/player.entity';
import type { Settings } from './entities/settings.entity';
import { LobbyStatus, LobbyScreen } from './entities/lobby.entity';

/**Интерфейсы для работы с лобби */

/**
 * Интерфейс для поиска лобби
 * @param lobbyCode код лобби
 */
export interface LobbyServiceFindLobbyParams {
  lobbyCode: string;
}

/**
 * Интерфейс для поиска нескольких лобби
 * @param lobbyCodes массив кодов лобби
 */
export interface LobbyServiceFindLobbiesParams {
  lobbyCodes: string[];
}

/**
 * Интерфейс для создания лобби
 * @param adminId id администратора лобби
 * @param players массив игроков в лобби
 * @param settings настройки лобби
 */
export interface LobbyServiceCreateLobbyParams {
  adminId: string;
  players: Player[];
  settings: Settings;
}

/**
 * Интерфейс для обновления лобби
 * @param lobbyCode код лобби
 * @param players массив игроков в лобби
 * @param settings настройки лобби
 * @param status статус игры в лобби
 * @param currentScreen текущий экран в лобби
 */
export interface LobbyServiceUpdateLobbyParams {
  lobbyCode: string;
  players?: Player[];
  settings?: Settings;
  status?: LobbyStatus;
  currentScreen?: LobbyScreen;
}

/**
 * Интерфейс для удаления лобби
 * @param lobbyCode код лобби
 */
export interface LobbyServiceDeleteLobbyParams {
  lobbyCode: string;
}

/**
 * Интерфейс для присоединения к лобби
 * @param lobbyCode код лобби
 * @param player игрок, который присоединяется к лобби
 */
export interface LobbyServiceJoinParams { 
  lobbyCode: string;
  player: Player;
}

/**
 * Интерфейс для переключения готовности игрока
 * @param lobbyCode код лобби
 * @param telegramId id игрока, который переключает готовность
 * @param loserTask задание для проигравшего
 */
export interface LobbyServiceToggleReadyParams {
  lobbyCode: string;
  telegramId: string;
  loserTask: string | null;
}

/**
 * Интерфейс для начала игры
 * @param lobbyCode код лобби
 * @param telegramId id игрока, который начинает игру
 */
export interface LobbyServiceStartGameParams {
  lobbyCode: string;
  telegramId: string;
  loserTask: string | null;
}
