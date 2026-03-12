import type {
  GameStatusChangedPayload,
  GameStatePayload,
  GameSubscribeSocketPayload,
  LiarChoseSocketPayload,
  PlayerLikedSocketPayload,
  PlayerSecuredSocketPayload,
  PlayerVotedSocketPayload,
} from '../contracts/game.contracts';
import type {
  LobbyStatusChangedPayload,
  JoinLobbySocketPayload,
  LobbyCodePayload,
  LobbyStatePayload,
  ToggleReadySocketPayload,
} from '../contracts/lobby.contracts';
import type { SocketAckPayload, SocketErrorPayload } from '../contracts/socket.contracts';
import { GameSocketEvents } from '../events/game.events';
import { LobbySocketEvents } from '../events/lobby.events';
import { SocketSystemEvents } from '../events/socket.events';

/**
 * Карта исходящих от клиента socket-событий и их payload.
 */
export type ClientToServerEventMap = {
  [LobbySocketEvents.PLAYER_JOINED]: JoinLobbySocketPayload;
  [LobbySocketEvents.LOBBY_SUBSCRIBE]: LobbyCodePayload;
  [LobbySocketEvents.PLAYER_READY]: ToggleReadySocketPayload;
  [LobbySocketEvents.PLAYER_LEFT]: LobbyCodePayload;
  [LobbySocketEvents.PLAYER_EXIT_GAME]: LobbyCodePayload;
  [GameSocketEvents.GAME_SUBSCRIBE]: GameSubscribeSocketPayload;
  [GameSocketEvents.LIAR_CHOSE]: LiarChoseSocketPayload;
  [GameSocketEvents.PLAYER_VOTED]: PlayerVotedSocketPayload;
  [GameSocketEvents.PLAYER_SECURED]: PlayerSecuredSocketPayload;
  [GameSocketEvents.PLAYER_LIKED]: PlayerLikedSocketPayload;
  [GameSocketEvents.GAME_STARTED]: LobbyCodePayload;
};

/**
 * Карта входящих на клиента socket-событий и их payload.
 */
export type ServerToClientEventMap = {
  [SocketSystemEvents.ERROR]: SocketErrorPayload;
  [SocketSystemEvents.STATUS_CHANGED]: LobbyStatusChangedPayload | GameStatusChangedPayload;
  [LobbySocketEvents.LOBBY_STATE]: LobbyStatePayload;
  [LobbySocketEvents.PLAYER_JOINED]: LobbyStatePayload;
  [LobbySocketEvents.LOBBY_DELETED]: LobbyCodePayload;
  [GameSocketEvents.GAME_STATE]: GameStatePayload;
};

/**
 * Payload для системного события изменения состояния.
 * Может быть как лобби-диффом, так и игровым диффом.
 */
export type StatusChangedPayload = ServerToClientEventMap[typeof SocketSystemEvents.STATUS_CHANGED];

/**
 * Type guard: системное изменение относится к игровому процессу.
 */
export function isGameStatusChangedPayload(
  payload: StatusChangedPayload,
): payload is GameStatusChangedPayload {
  return payload.status?.startsWith('game:') === true;
}

/**
 * Type guard: системное изменение относится к лобби.
 */
export function isLobbyStatusChangedPayload(
  payload: StatusChangedPayload,
): payload is LobbyStatusChangedPayload {
  return payload.status?.startsWith('lobby:') === true;
}

/**
 * Карта событий клиента с ack-подтверждением сервера.
 */
export type ClientToServerAckMap = {
  [LobbySocketEvents.PLAYER_LEFT]: SocketAckPayload;
  [LobbySocketEvents.PLAYER_EXIT_GAME]: SocketAckPayload;
};
