import { useCallback, useEffect, useMemo, useState } from 'react';
import { LobbySocketEvents } from '@common/message-types/events/lobby.events';
import { SocketSystemEvents } from '@common/message-types/events/socket.events';
import type { SocketErrorPayload } from '@common/message-types/contracts/socket.contracts';
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

/**
 * Состояние лобби
 */
type LobbyState = {
  /**
   * Код для подключения к лобби
   */
  lobbyCode: string;

  /**
   * id админа
   */
  adminId: string;

  /**
   * Текущий id игры, если есть
   */
  currentGameId?: string | null;

  /**
   * Статус
   */
  status: string;

  /**
   * Массив игроков
   */
  players: {
    id: string;
    nickname: string;
    profileImg?: string;
    isReady?: boolean;
    loserTask?: string | null;
  }[];
};

type Mode = 'admin' | 'player';

function isReadyErrorCode(code: string): boolean {
  return (
    code === 'PLAYER_READY_ERROR' ||
    code === 'USER_NOT_FOUND_OR_LOBBY_EMPTY' ||
    code === 'PLAYER_READY_FORBIDDEN'
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
    (state: LobbyState) => {
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
      } catch {
        lobbySessionService.clear();
        navigate('/', { replace: true });
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
      .catch(() => {
        navigate('/', { replace: true });
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
      void refreshLobby(lobbyCode);
    };

    const onSocketError = (error: SocketErrorPayload) => {
      const code = error.errorCode ?? error.message ?? '';
      if (isReadyErrorCode(code)) {
        setReadyError(
          `Не удалось изменить готовность (${code}). Обновите страницу и попробуйте снова.`,
        );
      }
    };

    socket.on(SocketSystemEvents.STATUS_CHANGED, onGameStatusChanged);
    socket.on(LobbySocketEvents.LOBBY_DELETED, onLobbyDeleted);
    socket.on(SocketSystemEvents.ERROR, onSocketError);

    return () => {
      socket.off(SocketSystemEvents.STATUS_CHANGED, onGameStatusChanged);
      socket.off(LobbySocketEvents.LOBBY_DELETED, onLobbyDeleted);
      socket.off(SocketSystemEvents.ERROR, onSocketError);
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
