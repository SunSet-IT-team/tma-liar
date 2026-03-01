import { useCallback, useEffect, useMemo, useState } from 'react';
import { LobbySocketEvents } from '@common/message-types';
import { SocketSystemEvents } from '@common/message-types';
import type { LobbyStatePayload } from '@common/message-types';
import type { SocketErrorPayload } from '@common/message-types';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '@app/routes/pages';
import { getCurrentTmaUser } from '@shared/lib/tma/user';
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

  /**
   * Текущий пользователь
   */
  const user = useMemo(() => getCurrentTmaUser(), []);

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
      const me = state.players.find((player) => player.id === user.telegramId);

      /**
       * Проверяем свою готовность
       */
      if (typeof me?.isReady === 'boolean') {
        setReady(me.isReady);
      }

      setLoserTask(typeof me?.loserTask === 'string' ? me.loserTask : '');
    },
    [user.telegramId],
  );

  const refreshLobby = useCallback(
    async (lobbyCode: string) => {
      try {
        const state = await subscribeLobbyRoom(lobbyCode);
        const meInLobby = state.players.some((player) => player.id === user.telegramId);
        if (!meInLobby) {
          lobbySessionService.clear();
          navigate('/', { replace: true });
          return;
        }
        syncLobbyState(state);
      } catch (error) {
        lobbySessionService.clear();
        navigate(
          isLobbyMissingError(error) ? `/${PageRoutes.NOT_FOUND}` : '/',
          { replace: true },
        );
      }
    },
    [navigate, syncLobbyState, user.telegramId],
  );

  useEffect(() => {
    if (!session?.lobbyCode) {
      navigate('/');
      return;
    }

    const socket = getLobbySocket();
    const lobbyCode = session.lobbyCode;

    void subscribeLobbyRoom(lobbyCode)
      .then((state) => {
        const meInLobby = state.players.some((player) => player.id === user.telegramId);
        if (!meInLobby) {
          lobbySessionService.clear();
          navigate('/', { replace: true });
          return;
        }

        syncLobbyState(state);

        if (mode === 'admin' && state.adminId !== user.telegramId) {
          navigate(`/${PageRoutes.LOBBY_PLAYER}`, { replace: true });
        }
      })
      .catch((error) => {
        navigate(
          isLobbyMissingError(error) ? `/${PageRoutes.NOT_FOUND}` : '/',
          { replace: true },
        );
      });

    const onGameStatusChanged = (payload: ChangeGameStatusPayload) => {
      setSession((prev) => {
        if (!prev) return prev;

        const next = applyLobbyDiff(prev, payload);
        lobbySessionService.set(next);
        return next;
      });

      const currentPlayerReady = getCurrentPlayerReady(payload, user.telegramId);
      if (currentPlayerReady !== null) {
        setReady(currentPlayerReady);
      }

      const currentPlayer = payload.diff?.players?.find((player) => player.id === user.telegramId);
      if (typeof currentPlayer?.loserTask === 'string') {
        setLoserTask(currentPlayer.loserTask);
      }

      const nextAdminId = payload.diff?.adminId;
      if (mode === 'admin' && nextAdminId && nextAdminId !== user.telegramId) {
        navigate(`/${PageRoutes.LOBBY_PLAYER}`, { replace: true });
      }
    };

    const onLobbyDeleted = () => {
      lobbySessionService.clear();
      navigate(`/${PageRoutes.NOT_FOUND}`, { replace: true });
    };

    const onSocketError = (error: SocketErrorPayload) => {
      const code = error.errorCode ?? error.message ?? '';
      if (isReadyErrorCode(code)) {
        setReadyError(
          `Не удалось изменить готовность (${code}). Обновите страницу и попробуйте снова.`,
        );
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
  }, [mode, navigate, refreshLobby, session?.lobbyCode, syncLobbyState, user.telegramId]);

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
