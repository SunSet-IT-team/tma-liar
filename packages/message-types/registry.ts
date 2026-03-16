import { GameMessageTypes, LobbyMessageTypes } from './enums';
import { SocketSystemEvents } from './events';

/**
 * Реестр всех категорий socket-событий.
 */
export const MessageTypes = {
  /** События лобби. */
  Lobby: LobbyMessageTypes,
  /** События игры. */
  Game: GameMessageTypes,
  /** Системные события. */
  System: SocketSystemEvents,
};
