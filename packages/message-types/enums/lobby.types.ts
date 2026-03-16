/**
 * Список lobby-событий в enum-форме.
 * Используется в backend-слое (socket handlers/services).
 */
export const LobbyMessageTypes = {
  /** Изменено состояние лобби/игры (дифф/снимок). */
  STATUS_CHANGED: 'lobby:changed:status',
  /** Игрок вошел в лобби. */
  PLAYER_JOINED: 'lobby:player:joined',
  /** Подписка сокета на комнату лобби. */
  LOBBY_SUBSCRIBE: 'lobby:subscribe',
  /** Полное состояние лобби для подписавшегося сокета. */
  LOBBY_STATE: 'lobby:state',
  /** Игрок сменил готовность. */
  PLAYER_READY: 'lobby:player:ready',
  /** Игрок вышел из лобби. */
  PLAYER_LEFT: 'lobby:player:left',
  /** Игрок вышел из текущей игры, но остался в лобби. */
  PLAYER_EXIT_GAME: 'lobby:player:exit-game',
  /** Лобби удалено сервером. */
  LOBBY_DELETED: 'lobby:deleted',
} as const;

/**
 * Union-тип lobby-событий из `LobbyMessageTypes`.
 */
export type LobbyMessageType = (typeof LobbyMessageTypes)[keyof typeof LobbyMessageTypes];
