import { io, type Socket } from 'socket.io-client';
import { authService } from '../auth.service';
import type { LobbyStateView } from '../../types/lobby';
import { getCurrentTmaUser } from '../../lib/tma/user';

const LOBBY_PLAYER_JOINED_EVENT = 'lobby:player:joined';
const LOBBY_PLAYER_LEFT_EVENT = 'lobby:player:left';
const LOBBY_SUBSCRIBE_EVENT = 'lobby:subscribe';
const LOBBY_STATE_EVENT = 'lobby:state';
const ERROR_EVENT = 'error';

let socket: Socket | null = null;

function getSocketUrl() {
  return import.meta.env.VITE_WS_URL ?? window.location.origin;
}

export function getLobbySocket(): Socket {
  const token = authService.getToken();
  const userId = getCurrentTmaUser().telegramId;

  if (socket && socket.connected) {
    return socket;
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

  return socket;
}

export function disconnectLobbySocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
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
  return new Promise<LobbyStateView>((resolve, reject) => {
    const s = getLobbySocket();

    const timeout = window.setTimeout(() => {
      s.off(LOBBY_STATE_EVENT, onState);
      s.off(ERROR_EVENT, onError);
      reject(new Error('LOBBY_SUBSCRIBE_TIMEOUT'));
    }, 7000);

    const onState = (data: LobbyStateView) => {
      clearTimeout(timeout);
      s.off(ERROR_EVENT, onError);
      resolve(data);
    };

    const onError = (error: { errorCode?: string; message?: string }) => {
      clearTimeout(timeout);
      s.off(LOBBY_STATE_EVENT, onState);
      reject(new Error(error.errorCode ?? error.message ?? 'LOBBY_SUBSCRIBE_ERROR'));
    };

    s.once(LOBBY_STATE_EVENT, onState);
    s.once(ERROR_EVENT, onError);
    s.emit(LOBBY_SUBSCRIBE_EVENT, { lobbyCode });
  });
}

export function leaveLobbyBySocket(payload: { lobbyCode: string }) {
  const s = getLobbySocket();
  s.emit(LOBBY_PLAYER_LEFT_EVENT, payload);
  window.setTimeout(() => {
    disconnectLobbySocket();
  });
}
