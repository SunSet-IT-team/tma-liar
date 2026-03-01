import { io, type Socket } from 'socket.io-client';
import { authService } from '../auth.service';
import type { LobbyStateView } from '../../types/lobby';
import { getCurrentTmaUser } from '../../lib/tma/user';

const LOBBY_PLAYER_JOINED_EVENT = 'lobby:player:joined';
const LOBBY_PLAYER_LEFT_EVENT = 'lobby:player:left';
const LOBBY_SUBSCRIBE_EVENT = 'lobby:subscribe';
const LOBBY_STATE_EVENT = 'lobby:state';
const GAME_SUBSCRIBE_EVENT = 'game:subscribe';
const GAME_STATE_EVENT = 'game:state';
const ERROR_EVENT = 'error';

let socket: Socket | null = null;
let debugBound = false;
let socketUserId: string | null = null;
let lobbySubscribeInFlight: Promise<LobbyStateView> | null = null;
let lobbySubscribeCodeInFlight: string | null = null;
let gameSubscribeInFlight: Promise<GameSocketState> | null = null;
let gameSubscribeIdInFlight: string | null = null;

function getSocketUrl() {
  return import.meta.env.VITE_WS_URL ?? window.location.origin;
}

function bindSocketDebug(s: Socket) {
  if (!import.meta.env.DEV || debugBound) return;
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
    console.warn('SOCKET_TOKEN_NOT_FOUND: connecting in guest mode');
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

export function joinLobbyBySocket(payload: {
  lobbyCode: string;
  nickname?: string;
  profileImg?: string;
  loserTask?: string;
}) {
  return new Promise<LobbyStateView>((resolve, reject) => {
    const s = getLobbySocket();

    const timeout = window.setTimeout(() => {
      s.off(LOBBY_PLAYER_JOINED_EVENT, onJoined);
      s.off(ERROR_EVENT, onError);
      reject(new Error('JOIN_LOBBY_TIMEOUT'));
    }, 7000);

    const onJoined = (data: LobbyStateView) => {
      clearTimeout(timeout);
      s.off(ERROR_EVENT, onError);
      resolve(data);
    };

    const onError = (error: { errorCode?: string; message?: string }) => {
      clearTimeout(timeout);
      s.off(LOBBY_PLAYER_JOINED_EVENT, onJoined);
      reject(new Error(error.errorCode ?? error.message ?? 'JOIN_LOBBY_SOCKET_ERROR'));
    };

    s.once(LOBBY_PLAYER_JOINED_EVENT, onJoined);
    s.once(ERROR_EVENT, onError);
    s.emit(LOBBY_PLAYER_JOINED_EVENT, payload);
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
      s.off(LOBBY_STATE_EVENT, onState);
      s.off(ERROR_EVENT, onError);
      lobbySubscribeInFlight = null;
      lobbySubscribeCodeInFlight = null;
      reject(new Error('LOBBY_SUBSCRIBE_TIMEOUT'));
    }, 7000);

    const onState = (data: LobbyStateView) => {
      clearTimeout(timeout);
      s.off(ERROR_EVENT, onError);
      lobbySubscribeInFlight = null;
      lobbySubscribeCodeInFlight = null;
      resolve(data);
    };

    const onError = (error: { errorCode?: string; message?: string }) => {
      clearTimeout(timeout);
      s.off(LOBBY_STATE_EVENT, onState);
      lobbySubscribeInFlight = null;
      lobbySubscribeCodeInFlight = null;
      reject(new Error(error.errorCode ?? error.message ?? 'LOBBY_SUBSCRIBE_ERROR'));
    };

    s.once(LOBBY_STATE_EVENT, onState);
    s.once(ERROR_EVENT, onError);
    s.emit(LOBBY_SUBSCRIBE_EVENT, { lobbyCode });
  });

  return lobbySubscribeInFlight;
}

export type GameSocketState = {
  gameId: string;
  stage?: string;
  stageStartedAt?: number;
  stageDurationMs?: number | null;
  liarId?: string | null;
  activeQuestion?: string | null;
  activeQuestionText?: string | null;
  winnerId?: string | null;
  loserId?: string | null;
  loserTask?: string | null;
  players?: Array<{
    id: string;
    nickname: string;
    profileImg?: string;
    isReady?: boolean;
    inGame?: boolean;
    loserTask?: string | null;
    answer?: number | null;
    likes?: number;
    isConfirmed?: boolean | null;
    score?: number;
  }>;
};

export function subscribeGameRoom(gameId: string) {
  if (gameSubscribeInFlight && gameSubscribeIdInFlight === gameId) {
    return gameSubscribeInFlight;
  }

  gameSubscribeIdInFlight = gameId;
  gameSubscribeInFlight = new Promise<GameSocketState>((resolve, reject) => {
    const s = getLobbySocket();

    const timeout = window.setTimeout(() => {
      s.off(GAME_STATE_EVENT, onState);
      s.off(ERROR_EVENT, onError);
      gameSubscribeInFlight = null;
      gameSubscribeIdInFlight = null;
      reject(new Error('GAME_SUBSCRIBE_TIMEOUT'));
    }, 7000);

    const onState = (data: GameSocketState) => {
      clearTimeout(timeout);
      s.off(ERROR_EVENT, onError);
      gameSubscribeInFlight = null;
      gameSubscribeIdInFlight = null;
      resolve(data);
    };

    const onError = (error: { errorCode?: string; message?: string }) => {
      clearTimeout(timeout);
      s.off(GAME_STATE_EVENT, onState);
      gameSubscribeInFlight = null;
      gameSubscribeIdInFlight = null;
      reject(new Error(error.errorCode ?? error.message ?? 'GAME_SUBSCRIBE_ERROR'));
    };

    s.once(GAME_STATE_EVENT, onState);
    s.once(ERROR_EVENT, onError);
    s.emit(GAME_SUBSCRIBE_EVENT, { gameId });
  });

  return gameSubscribeInFlight;
}

export function leaveLobbyBySocket(payload: { lobbyCode: string }) {
  return new Promise<void>((resolve, reject) => {
    const s = getLobbySocket();

    const timeout = window.setTimeout(() => {
      disconnectLobbySocket();
      reject(new Error('LEAVE_LOBBY_TIMEOUT'));
    }, 5000);

    s.emit(
      LOBBY_PLAYER_LEFT_EVENT,
      payload,
      (ack?: { ok?: boolean; errorCode?: string; message?: string }) => {
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
