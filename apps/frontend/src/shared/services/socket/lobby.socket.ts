import { io, type Socket } from 'socket.io-client';
import {
  GameSocketEvents,
  type GameStatePayload,
  GameStatePayloadSchema,
  JoinLobbySocketPayloadSchema,
  LobbyCodePayloadSchema,
  LobbySocketEvents,
  type LobbyStatePayload,
  LobbyStatePayloadSchema,
  PROTOCOL_VERSION,
  type SocketAckPayload,
  type SocketErrorPayload,
  SocketErrorPayloadSchema,
  SocketSystemEvents,
} from '@common/message-types';
import type { JoinLobbySocketPayload, LobbyCodePayload } from '@common/message-types';
import { authService } from '../auth.service';
import { getCurrentTmaUser } from '../../lib/tma/user';
import { emitEvent, emitEventWithAck, offEvent, onceEvent } from './typed-socket';

let socket: Socket | null = null;
let debugBound = false;
let socketUserId: string | null = null;
let lobbySubscribeInFlight: Promise<LobbyStatePayload> | null = null;
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
  authPayload.protocolVersion = String(PROTOCOL_VERSION);

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
  return new Promise<LobbyStatePayload>((resolve, reject) => {
    const s = getLobbySocket();
    const validatedPayload = JoinLobbySocketPayloadSchema.parse(payload);

    const timeout = window.setTimeout(() => {
      offEvent(s, LobbySocketEvents.PLAYER_JOINED, onJoined);
      offEvent(s, SocketSystemEvents.ERROR, onError);
      reject(new Error('JOIN_LOBBY_TIMEOUT'));
    }, 7000);

    const onJoined = (data: LobbyStatePayload) => {
      clearTimeout(timeout);
      offEvent(s, SocketSystemEvents.ERROR, onError);
      resolve(LobbyStatePayloadSchema.parse(data));
    };

    const onError = (error: SocketErrorPayload) => {
      clearTimeout(timeout);
      offEvent(s, LobbySocketEvents.PLAYER_JOINED, onJoined);
      const parsed = SocketErrorPayloadSchema.parse(error);
      reject(new Error(parsed.errorCode ?? parsed.message ?? 'JOIN_LOBBY_SOCKET_ERROR'));
    };

    onceEvent(s, LobbySocketEvents.PLAYER_JOINED, onJoined);
    onceEvent(s, SocketSystemEvents.ERROR, onError);
    emitEvent(s, LobbySocketEvents.PLAYER_JOINED, validatedPayload);
  });
}

export function subscribeLobbyRoom(lobbyCode: string) {
  if (lobbySubscribeInFlight && lobbySubscribeCodeInFlight === lobbyCode) {
    return lobbySubscribeInFlight;
  }

  lobbySubscribeCodeInFlight = lobbyCode;
  lobbySubscribeInFlight = new Promise<LobbyStatePayload>((resolve, reject) => {
    const s = getLobbySocket();

    const timeout = window.setTimeout(() => {
      offEvent(s, LobbySocketEvents.LOBBY_STATE, onState);
      offEvent(s, SocketSystemEvents.ERROR, onError);
      lobbySubscribeInFlight = null;
      lobbySubscribeCodeInFlight = null;
      reject(new Error('LOBBY_SUBSCRIBE_TIMEOUT'));
    }, 7000);

    const onState = (data: LobbyStatePayload) => {
      clearTimeout(timeout);
      offEvent(s, SocketSystemEvents.ERROR, onError);
      lobbySubscribeInFlight = null;
      lobbySubscribeCodeInFlight = null;
      resolve(LobbyStatePayloadSchema.parse(data));
    };

    const onError = (error: SocketErrorPayload) => {
      clearTimeout(timeout);
      offEvent(s, LobbySocketEvents.LOBBY_STATE, onState);
      lobbySubscribeInFlight = null;
      lobbySubscribeCodeInFlight = null;
      const parsed = SocketErrorPayloadSchema.parse(error);
      reject(new Error(parsed.errorCode ?? parsed.message ?? 'LOBBY_SUBSCRIBE_ERROR'));
    };

    onceEvent(s, LobbySocketEvents.LOBBY_STATE, onState);
    onceEvent(s, SocketSystemEvents.ERROR, onError);
    emitEvent(s, LobbySocketEvents.LOBBY_SUBSCRIBE, LobbyCodePayloadSchema.parse({ lobbyCode }));
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
      offEvent(s, GameSocketEvents.GAME_STATE, onState);
      offEvent(s, SocketSystemEvents.ERROR, onError);
      gameSubscribeInFlight = null;
      gameSubscribeIdInFlight = null;
      reject(new Error('GAME_SUBSCRIBE_TIMEOUT'));
    }, 7000);

    const onState = (data: GameSocketState) => {
      clearTimeout(timeout);
      offEvent(s, SocketSystemEvents.ERROR, onError);
      gameSubscribeInFlight = null;
      gameSubscribeIdInFlight = null;
      const parsed = GameStatePayloadSchema.safeParse(data);
      if (parsed.success) {
        resolve(parsed.data);
        return;
      }

      // Защита от частичного payload в переходных моментах:
      // если backend не прислал gameId, используем тот, на который подписывались.
      const fallbackParsed = GameStatePayloadSchema.safeParse({
        ...data,
        gameId,
      });

      if (fallbackParsed.success) {
        resolve(fallbackParsed.data);
        return;
      }

      reject(parsed.error);
    };

    const onError = (error: SocketErrorPayload) => {
      clearTimeout(timeout);
      offEvent(s, GameSocketEvents.GAME_STATE, onState);
      gameSubscribeInFlight = null;
      gameSubscribeIdInFlight = null;
      const parsed = SocketErrorPayloadSchema.parse(error);
      reject(new Error(parsed.errorCode ?? parsed.message ?? 'GAME_SUBSCRIBE_ERROR'));
    };

    onceEvent(s, GameSocketEvents.GAME_STATE, onState);
    onceEvent(s, SocketSystemEvents.ERROR, onError);
    emitEvent(s, GameSocketEvents.GAME_SUBSCRIBE, { gameId });
  });

  return gameSubscribeInFlight;
}

export function leaveLobbyBySocket(payload: LobbyCodePayload) {
  return new Promise<void>((resolve, reject) => {
    const s = getLobbySocket();
    const validatedPayload = LobbyCodePayloadSchema.parse(payload);

    const timeout = window.setTimeout(() => {
      disconnectLobbySocket();
      reject(new Error('LEAVE_LOBBY_TIMEOUT'));
    }, 5000);

    emitEventWithAck(
      s,
      LobbySocketEvents.PLAYER_LEFT,
      validatedPayload,
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
    const validatedPayload = LobbyCodePayloadSchema.parse(payload);

    const timeout = window.setTimeout(() => {
      reject(new Error('EXIT_GAME_TIMEOUT'));
    }, 5000);

    emitEventWithAck(
      s,
      LobbySocketEvents.PLAYER_EXIT_GAME,
      validatedPayload,
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
