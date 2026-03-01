import { io, type Socket } from 'socket.io-client';
import type { GameStatePayload } from '@common/message-types/contracts/game.contracts';
import type {
  JoinLobbySocketPayload,
  LobbyCodePayload,
} from '@common/message-types/contracts/lobby.contracts';
import { GameSocketEvents } from '@common/message-types/events/game.events';
import { LobbySocketEvents } from '@common/message-types/events/lobby.events';
import { SocketSystemEvents } from '@common/message-types/events/socket.events';
import type { SocketAckPayload, SocketErrorPayload } from '@common/message-types/contracts/socket.contracts';
import { authService } from '../auth.service';
import type { LobbyStateView } from '../../types/lobby';
import { getCurrentTmaUser } from '../../lib/tma/user';

let socket: Socket | null = null;
let debugBound = false;
let socketUserId: string | null = null;
let lobbySubscribeInFlight: Promise<LobbyStateView> | null = null;
let lobbySubscribeCodeInFlight: string | null = null;
let gameSubscribeInFlight: Promise<GameSocketState> | null = null;
let gameSubscribeIdInFlight: string | null = null;
let tokenWarningShown = false;

function getSocketUrl() {
  return import.meta.env.VITE_WS_URL ?? window.location.origin;
}

function bindSocketDebug(s: Socket) {
  const socketDebugEnabled = import.meta.env.DEV && import.meta.env.VITE_SOCKET_DEBUG === 'true';

  if (!socketDebugEnabled || debugBound) return;
  debugBound = true;

  const originalEmit = s.emit.bind(s);
  s.emit = ((event: string, ...args: unknown[]) => {
    console.log('[socket:emit]', event, ...args);
    return originalEmit(event, ...args);
  }) as Socket['emit'];

  s.onAny((event, ...args) => {
    console.log('[socket:recv]', event, ...args);
  });

  s.on('connect', () => {
    console.log('[socket:connect]', { id: s.id });
  });

  s.on('disconnect', (reason) => {
    console.log('[socket:disconnect]', { reason });
  });

  s.on('connect_error', (error) => {
    console.error('[socket:connect_error]', error);
  });
}

export function getLobbySocket(): Socket {
  const token = authService.getToken();
  const userId = getCurrentTmaUser().telegramId;

  // Reuse the same socket instance for the same user even while it is connecting/reconnecting.
  if (socket && socketUserId === userId) {
    return socket;
  }

  if (socket && socket.connected && socketUserId !== userId) {
    console.warn('[socket:reconnect]', {
      reason: 'USER_ID_CHANGED',
      previousUserId: socketUserId,
      nextUserId: userId,
    });
    socket.disconnect();
    socket = null;
    debugBound = false;
  }

  const authPayload: Record<string, string> = {};
  authPayload.userId = userId;

  if (token) {
    authPayload.token = token;
  } else {
    // Не роняем UI: в dev режиме backend может быть запущен с DISABLE_AUTH=true.
    if (!tokenWarningShown) {
      console.warn('SOCKET_TOKEN_NOT_FOUND: connecting in guest mode');
      tokenWarningShown = true;
    }
  }

  socket = io(getSocketUrl(), {
    path: '/socket.io',
    transports: ['websocket'],
    auth: authPayload,
  });
  socketUserId = userId;
  bindSocketDebug(socket);

  return socket;
}

export function disconnectLobbySocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  debugBound = false;
  socketUserId = null;
  lobbySubscribeInFlight = null;
  lobbySubscribeCodeInFlight = null;
  gameSubscribeInFlight = null;
  gameSubscribeIdInFlight = null;
}

export function joinLobbyBySocket(payload: JoinLobbySocketPayload) {
  return new Promise<LobbyStateView>((resolve, reject) => {
    const s = getLobbySocket();

    const timeout = window.setTimeout(() => {
      s.off(LobbySocketEvents.PLAYER_JOINED, onJoined);
      s.off(SocketSystemEvents.ERROR, onError);
      reject(new Error('JOIN_LOBBY_TIMEOUT'));
    }, 7000);

    const onJoined = (data: LobbyStateView) => {
      clearTimeout(timeout);
      s.off(SocketSystemEvents.ERROR, onError);
      resolve(data);
    };

    const onError = (error: SocketErrorPayload) => {
      clearTimeout(timeout);
      s.off(LobbySocketEvents.PLAYER_JOINED, onJoined);
      reject(new Error(error.errorCode ?? error.message ?? 'JOIN_LOBBY_SOCKET_ERROR'));
    };

    s.once(LobbySocketEvents.PLAYER_JOINED, onJoined);
    s.once(SocketSystemEvents.ERROR, onError);
    s.emit(LobbySocketEvents.PLAYER_JOINED, payload);
  });
}

export function subscribeLobbyRoom(lobbyCode: string) {
  if (lobbySubscribeInFlight && lobbySubscribeCodeInFlight === lobbyCode) {
    return lobbySubscribeInFlight;
  }

  lobbySubscribeCodeInFlight = lobbyCode;
  lobbySubscribeInFlight = new Promise<LobbyStateView>((resolve, reject) => {
    const s = getLobbySocket();

    const timeout = window.setTimeout(() => {
      s.off(LobbySocketEvents.LOBBY_STATE, onState);
      s.off(SocketSystemEvents.ERROR, onError);
      lobbySubscribeInFlight = null;
      lobbySubscribeCodeInFlight = null;
      reject(new Error('LOBBY_SUBSCRIBE_TIMEOUT'));
    }, 7000);

    const onState = (data: LobbyStateView) => {
      clearTimeout(timeout);
      s.off(SocketSystemEvents.ERROR, onError);
      lobbySubscribeInFlight = null;
      lobbySubscribeCodeInFlight = null;
      resolve(data);
    };

    const onError = (error: SocketErrorPayload) => {
      clearTimeout(timeout);
      s.off(LobbySocketEvents.LOBBY_STATE, onState);
      lobbySubscribeInFlight = null;
      lobbySubscribeCodeInFlight = null;
      reject(new Error(error.errorCode ?? error.message ?? 'LOBBY_SUBSCRIBE_ERROR'));
    };

    s.once(LobbySocketEvents.LOBBY_STATE, onState);
    s.once(SocketSystemEvents.ERROR, onError);
    s.emit(LobbySocketEvents.LOBBY_SUBSCRIBE, { lobbyCode });
  });

  return lobbySubscribeInFlight;
}

export type GameSocketState = GameStatePayload;

export function subscribeGameRoom(gameId: string) {
  if (gameSubscribeInFlight && gameSubscribeIdInFlight === gameId) {
    return gameSubscribeInFlight;
  }

  gameSubscribeIdInFlight = gameId;
  gameSubscribeInFlight = new Promise<GameSocketState>((resolve, reject) => {
    const s = getLobbySocket();

    const timeout = window.setTimeout(() => {
      s.off(GameSocketEvents.GAME_STATE, onState);
      s.off(SocketSystemEvents.ERROR, onError);
      gameSubscribeInFlight = null;
      gameSubscribeIdInFlight = null;
      reject(new Error('GAME_SUBSCRIBE_TIMEOUT'));
    }, 7000);

    const onState = (data: GameSocketState) => {
      clearTimeout(timeout);
      s.off(SocketSystemEvents.ERROR, onError);
      gameSubscribeInFlight = null;
      gameSubscribeIdInFlight = null;
      resolve(data);
    };

    const onError = (error: SocketErrorPayload) => {
      clearTimeout(timeout);
      s.off(GameSocketEvents.GAME_STATE, onState);
      gameSubscribeInFlight = null;
      gameSubscribeIdInFlight = null;
      reject(new Error(error.errorCode ?? error.message ?? 'GAME_SUBSCRIBE_ERROR'));
    };

    s.once(GameSocketEvents.GAME_STATE, onState);
    s.once(SocketSystemEvents.ERROR, onError);
    s.emit(GameSocketEvents.GAME_SUBSCRIBE, { gameId });
  });

  return gameSubscribeInFlight;
}

export function leaveLobbyBySocket(payload: LobbyCodePayload) {
  return new Promise<void>((resolve, reject) => {
    const s = getLobbySocket();

    const timeout = window.setTimeout(() => {
      disconnectLobbySocket();
      reject(new Error('LEAVE_LOBBY_TIMEOUT'));
    }, 5000);

    s.emit(
      LobbySocketEvents.PLAYER_LEFT,
      payload,
      (ack?: Partial<SocketAckPayload>) => {
        clearTimeout(timeout);
        disconnectLobbySocket();

        if (ack?.ok) {
          resolve();
          return;
        }

        reject(new Error(ack?.errorCode ?? ack?.message ?? 'LEAVE_LOBBY_ERROR'));
      },
    );
  });
}

export function exitGameBySocket(payload: LobbyCodePayload) {
  return new Promise<void>((resolve, reject) => {
    const s = getLobbySocket();

    const timeout = window.setTimeout(() => {
      reject(new Error('EXIT_GAME_TIMEOUT'));
    }, 5000);

    s.emit(
      LobbySocketEvents.PLAYER_EXIT_GAME,
      payload,
      (ack?: Partial<SocketAckPayload>) => {
        clearTimeout(timeout);

        if (ack?.ok) {
          resolve();
          return;
        }

        reject(new Error(ack?.errorCode ?? ack?.message ?? 'EXIT_GAME_ERROR'));
      },
    );
  });
}
