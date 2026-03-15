import { useCallback, useEffect, useMemo, useState } from 'react';
import { LobbySocketEvents } from '@common/message-types';
import { SocketSystemEvents } from '@common/message-types';
import type { LobbyStatePayload } from '@common/message-types';
import type { SocketErrorPayload } from '@common/message-types';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '@app/routes/pages';
import { preloadAllScreens } from '@app/routes/preloadScreens';
import { getCurrentUser, getCurrentUserId } from '@shared/lib/tma/user';
import {
  applyLobbyDiff,
  getCurrentPlayerReady,
  type ChangeGameStatusPayload,
} from '@shared/services/lobby/lobby-realtime';
import {
  type LobbySession,
  lobbySessionService,
} from '@shared/services/lobby/lobby-session.service';
import { getLobbySocket, subscribeLobbyRoom } from '@shared/services/socket/lobby.socket';
import { offEvent, onEvent } from '@shared/services/socket/typed-socket';
import { useNotify } from '@shared/lib/notify/notify';

type Mode = 'admin' | 'player';

function isReadyErrorCode(code: string): boolean {
  return (
    code === 'PLAYER_READY_ERROR' ||
    code === 'USER_NOT_FOUND_OR_LOBBY_EMPTY' ||
    code === 'PLAYER_READY_FORBIDDEN'
  );
}

function isLobbyMissingError(error: unknown): boolean {
  const maybeError = error as {
    message?: string;
    response?: { status?: number; data?: { errorCode?: string; message?: string } };
  };
  const codeFromResponse = maybeError?.response?.data?.errorCode ?? maybeError?.response?.data?.message;
  const message = maybeError?.message ?? '';
  const status = maybeError?.response?.status;

  return (
    status === 404 ||
    codeFromResponse === 'LOBBY_NOT_FOUND' ||
    message.includes('LOBBY_NOT_FOUND') ||
    message.includes('LOBBY_SUBSCRIBE_ERROR')
  );
}

export function useLobbyRealtimeSession(mode: Mode) {
  const navigate = useNavigate();
  const { notifyError } = useNotify();

  /**
   * Текущий пользователь
   */
  const user = useMemo(() => getCurrentUser(), []);

  /**
   * Сессия
   */
  const [session, setSession] = useState(() => lobbySessionService.get());

  /**
   * Статус игрока (готов/не готов)
   */
  const [ready, setReady] = useState<boolean>(false);

  /**
   * Задание для проигравшего
   */
  const [loserTask, setLoserTask] = useState('');

  /**
   * Ошибка
   */
  const [readyError, setReadyError] = useState<string | null>(null);

  /**
   * Синхронизация состояния лобби
   */
  const syncLobbyState = useCallback(
    (state: LobbyStatePayload) => {
      setSession((prev) => {
        if (!prev) return prev;

        const next: LobbySession = {
          ...prev,
          adminId: state.adminId,
          currentGameId: state.currentGameId ?? prev.currentGameId,
          status: state.status as LobbySession['status'],
          players: state.players.map((player) => ({
            id: player.id,
            nickname: player.nickname,
            profileImg: player.profileImg ?? '',
            isReady: player.isReady ?? false,
            inGame: false,
            loserTask: player.loserTask ?? null,
          })),
        };

        lobbySessionService.set(next);

        return next;
      });

      /**
       * Получаем информацию о себе по id
       */
      const me = state.players.find((player) => player.id === getCurrentUserId(user));

      /**
       * Проверяем свою готовность
       */
      if (typeof me?.isReady === 'boolean') {
        setReady(me.isReady);
      }

      setLoserTask(typeof me?.loserTask === 'string' ? me.loserTask : '');
    },
    [getCurrentUserId(user)],
  );

  /**
   * Может оно и не нужно
   */
  const refreshLobby = useCallback(
    async (lobbyCode: string) => {
      try {
        const state = await subscribeLobbyRoom(lobbyCode);
        const meInLobby = state.players.some((player) => player.id === getCurrentUserId(user));
        if (!meInLobby) {
          lobbySessionService.clear();
          console.log('meInLobby === false 2');
          navigate('/', { replace: true });
          return;
        }
        syncLobbyState(state);
      } catch (error) {
        if (isLobbyMissingError(error)) {
          lobbySessionService.clear();
          console.log('isLobbyMissingError 2');
          navigate(`/${PageRoutes.NOT_FOUND}`, { replace: true });
        } else {
          setReadyError(
            'Не удалось синхронизировать лобби. Обновите страницу и попробуйте ещё раз.',
          );
          notifyError('Не удалось синхронизировать лобби. Попробуйте ещё раз.');
        }
      }
    },
    [navigate, notifyError, setReadyError, syncLobbyState, getCurrentUserId(user)],
  );

  useEffect(() => {
    if (!session?.lobbyCode) {
      console.log('session?.lobbyCode === null');
      navigate('/');
      return;
    }

    const socket = getLobbySocket();
    const lobbyCode = session.lobbyCode;

    subscribeLobbyRoom(lobbyCode)
      .then((state) => {
        console.log(state);
        const meInLobby = state.players.some((player) => player.id === getCurrentUserId(user));
        if (!meInLobby) {
          lobbySessionService.clear();
          console.log('meInLobby === false');
          navigate('/', { replace: true });
          return;
        }

        syncLobbyState(state);

        if (mode === 'admin' && state.adminId !== getCurrentUserId(user)) {
          console.log('adminId !== getCurrentUserId(user)');
          navigate(`/${PageRoutes.LOBBY_PLAYER}`, { replace: true });
        }
      })
      .catch((error) => {
        if (isLobbyMissingError(error)) {
          lobbySessionService.clear();
          console.log('isLobbyMissingError');
          navigate(`/${PageRoutes.NOT_FOUND}`, { replace: true });
        } else {
          setReadyError(
            'Не удалось подключиться к лобби. Обновите страницу и попробуйте ещё раз.',
          );
          notifyError('Не удалось подключиться к лобби. Попробуйте ещё раз.');
        }
      });

    const onGameStatusChanged = (payload: ChangeGameStatusPayload) => {
      const status = payload.diff?.status ?? payload.status ?? null;
      const hasGameId = Object.prototype.hasOwnProperty.call(payload.diff ?? {}, 'currentGameId')
        ? Boolean(payload.diff?.currentGameId)
        : false;
      if (status === 'started' || hasGameId) {
        void preloadAllScreens();
      }

      setSession((prev) => {
        if (!prev) return prev;

        const next = applyLobbyDiff(prev, payload);
        lobbySessionService.set(next);
        return next;
      });

      const currentPlayerReady = getCurrentPlayerReady(payload, getCurrentUserId(user));
      if (currentPlayerReady !== null) {
        setReady(currentPlayerReady);
      }

      const currentPlayer = payload.diff?.players?.find((player) => player.id === getCurrentUserId(user));
      if (typeof currentPlayer?.loserTask === 'string') {
        setLoserTask(currentPlayer.loserTask);
      }

      const nextAdminId = payload.diff?.adminId;
      if (mode === 'admin' && nextAdminId && nextAdminId !== getCurrentUserId(user)) {
        console.log('onAdminChanged');
        navigate(`/${PageRoutes.LOBBY_PLAYER}`, { replace: true });
      }
    };

    const onLobbyDeleted = () => {
      lobbySessionService.clear();
      console.log('onLobbyDeleted');
      navigate(`/${PageRoutes.NOT_FOUND}`, { replace: true });
    };

    const onSocketError = (error: SocketErrorPayload) => {
      const code = error.errorCode ?? error.message ?? '';
      if (isReadyErrorCode(code)) {
        setReadyError(
          `Не удалось изменить готовность (${code}). Обновите страницу и попробуйте снова.`,
        );
        notifyError('Не удалось изменить готовность. Попробуйте ещё раз.');
      }
    };

    onEvent(socket, SocketSystemEvents.STATUS_CHANGED, onGameStatusChanged);
    onEvent(socket, LobbySocketEvents.LOBBY_DELETED, onLobbyDeleted);
    onEvent(socket, SocketSystemEvents.ERROR, onSocketError);

    return () => {
      offEvent(socket, SocketSystemEvents.STATUS_CHANGED, onGameStatusChanged);
      offEvent(socket, LobbySocketEvents.LOBBY_DELETED, onLobbyDeleted);
      offEvent(socket, SocketSystemEvents.ERROR, onSocketError);
    };
  }, [mode, navigate, refreshLobby, session?.lobbyCode, syncLobbyState, getCurrentUserId(user)]);

  return {
    user,
    session,
    ready,
    loserTask,
    readyError,
    setReady,
    setLoserTask,
    setReadyError,
    syncLobbyState,
  };
}
