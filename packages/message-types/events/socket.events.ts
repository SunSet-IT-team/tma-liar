/**
 * Системные socket-события, общие для frontend и backend.
 */
export const SocketSystemEvents = {
  /** Универсальный канал серверных ошибок. */
  ERROR: 'error',
  /** Универсальный канал частичных/полных обновлений состояния игры/лобби. */
  STATUS_CHANGED: 'changeGameStatus',
} as const;

/**
 * Union-тип системных socket-событий.
 */
export type SocketSystemEvent =
  (typeof SocketSystemEvents)[keyof typeof SocketSystemEvents];
