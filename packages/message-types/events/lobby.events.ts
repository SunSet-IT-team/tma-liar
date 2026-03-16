/**
 * Лобби socket-события в формате const-объекта.
 * Используется во frontend (совместимо с erasableSyntaxOnly).
 */
export const LobbySocketEvents = {
  /** Системное событие изменения состояния лобби/игры. */
  STATUS_CHANGED: 'lobby:changed:status',
  /** Игрок вошел в лобби. */
  PLAYER_JOINED: 'lobby:player:joined',
  /** Подписка сокета на лобби-комнату. */
  LOBBY_SUBSCRIBE: 'lobby:subscribe',
  /** Полный снимок состояния лобби. */
  LOBBY_STATE: 'lobby:state',
  /** Игрок сменил статус готовности. */
  PLAYER_READY: 'lobby:player:ready',
  /** Игрок вышел из лобби. */
  PLAYER_LEFT: 'lobby:player:left',
  /** Игрок вышел только из текущей игры, но остался в лобби. */
  PLAYER_EXIT_GAME: 'lobby:player:exit-game',
  /** Лобби удалено сервером (например, вышел админ и игроков не осталось). */
  LOBBY_DELETED: 'lobby:deleted',
} as const;

/**
 * Union-тип всех строковых lobby socket-событий.
 */
export type LobbySocketEvent =
  (typeof LobbySocketEvents)[keyof typeof LobbySocketEvents];
