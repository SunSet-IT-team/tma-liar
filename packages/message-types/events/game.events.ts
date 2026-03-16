/**
 * Игровые socket-события в формате const-объекта.
 * Используется во frontend (совместимо с erasableSyntaxOnly).
 */
export const GameSocketEvents = {
  /** Подписка сокета на игровую комнату. */
  GAME_SUBSCRIBE: 'game:subscribe',
  /** Полный снимок состояния игры для подключившегося клиента. */
  GAME_STATE: 'game:state',
  /** Лжец выбрал стратегию (врать/не врать). */
  LIAR_CHOSE: 'game:liar:chose',
  /** Решала отправил голос (верю/не верю). */
  PLAYER_VOTED: 'game:player:voted',
  /** Игрок зафиксировал свой выбор на этапе. */
  PLAYER_SECURED: 'game:player:secured',
  /** Игрок отправил лайк другому игроку. */
  PLAYER_LIKED: 'game:player:liked',
  /** Сервер сообщает о смене стадии игры. */
  STAGE_CHANGED: 'game:stage:changed',
  /** Админ инициировал старт игры. */
  GAME_STARTED: 'game:started',
} as const;

/**
 * Union-тип всех строковых игровых socket-событий.
 */
export type GameSocketEvent =
  (typeof GameSocketEvents)[keyof typeof GameSocketEvents];
