import { GameMessageTypes, LobbyMessageTypes } from './enums';
import { SocketSystemEvents } from './events';

/**
 * Реэкспорт общих контрактов socket-протокола (payload/ack/error).
 * Импортируйте типы из этого файла, если нужен единый вход.
 */
export * from './contracts';
export * from './events';
export * from './enums';

/**
 * Объект всех типов сообщений
 */
export const MessageTypes = {
  /**
   * Лобби
   */
  Lobby: LobbyMessageTypes,

  /**
   * Игра
   */
  Game: GameMessageTypes,

  /**
   * Системные
   */
  System: SocketSystemEvents,
};
