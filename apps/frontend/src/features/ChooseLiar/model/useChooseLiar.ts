import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameSocketEvents } from '@common/message-types';
import { SocketSystemEvents } from '@common/message-types';
import type { SocketErrorPayload } from '@common/message-types';
import { useAppDispatch } from '@app/store/hook';
import { PageRoutes } from '@app/routes/pages';
import { updateTimer } from '@entities/game/model/timerSlice';
import { getCurrentTmaUser } from '@shared/lib/tma/user';
import { findLobbyRequest } from '@shared/services/lobby/lobby.api';
import { lobbySessionService } from '@shared/services/lobby/lobby-session.service';
import { getLobbySocket, subscribeGameRoom } from '@shared/services/socket/lobby.socket';
import { toUserSocketError } from '@shared/services/socket/socket-error';
import { emitEvent, offEvent, onEvent } from '@shared/services/socket/typed-socket';

export function useChooseLiar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const user = useMemo(() => getCurrentTmaUser(), []);

  const chooseStrategy = async (answer: boolean) => {
    if (isSubmitting) return;

    let freshSession = lobbySessionService.get();
    if (!freshSession?.currentGameId && freshSession?.lobbyCode) {
      try {
        const lobby = await findLobbyRequest(freshSession.lobbyCode);
        if (lobby.currentGameId) {
          freshSession = {
            ...freshSession,
            currentGameId: lobby.currentGameId,
          };
          lobbySessionService.set(freshSession);
        }
      } catch {
        // Если запрос не удался, используем то, что есть в локальной сессии.
      }
    }

    if (!freshSession?.currentGameId) {
      const targetRoute =
        freshSession?.adminId === user.telegramId
          ? PageRoutes.LOBBY_ADMIN
          : PageRoutes.LOBBY_PLAYER;
      navigate(`/${targetRoute}`, { replace: true });
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);

    try {
      const gameState = await subscribeGameRoom(freshSession.currentGameId);
      const liarId = gameState.liarId ?? freshSession.currentLiarId ?? null;
      const stage = gameState.stage ?? freshSession.currentStage ?? null;

      if (stage !== 'liar_chooses') {
        setErrorText('Этап выбора лжеца уже завершён.');
        setIsSubmitting(false);
        return;
      }

      if (liarId !== user.telegramId) {
        setErrorText('Вы не лжец в этом раунде.');
        setIsSubmitting(false);
        return;
      }
    } catch {
      const fallbackSession = lobbySessionService.get();
      const targetRoute =
        fallbackSession?.adminId === user.telegramId
          ? PageRoutes.LOBBY_ADMIN
          : PageRoutes.LOBBY_PLAYER;
      navigate(`/${targetRoute}`, { replace: true });
      setIsSubmitting(false);
      return;
    }

    const socket = getLobbySocket();
    const onError = (error: SocketErrorPayload) => {
      const code = error.errorCode ?? error.message ?? '';
      if (
        code === 'LIAR_CHOSE_ERROR' ||
        code === 'WRONG_STAGE' ||
        code === 'GAME_NOT_FOUND' ||
        code === 'LIAR_NOT_FOUND' ||
        code === 'LIAR_CHOOSE_FORBIDDEN' ||
        code === 'PLAYER_ACTION_FORBIDDEN'
      ) {
        if (code === 'GAME_NOT_FOUND') {
          const fallbackSession = lobbySessionService.get();
          const targetRoute =
            fallbackSession?.adminId === user.telegramId
              ? PageRoutes.LOBBY_ADMIN
              : PageRoutes.LOBBY_PLAYER;
          navigate(`/${targetRoute}`, { replace: true });
          setIsSubmitting(false);
          offEvent(socket, SocketSystemEvents.ERROR, onError);
          return;
        }
        setErrorText(toUserSocketError(error, 'Не удалось отправить выбор'));
        setIsSubmitting(false);
      }
      offEvent(socket, SocketSystemEvents.ERROR, onError);
    };

    onEvent(socket, SocketSystemEvents.ERROR, onError);
    emitEvent(socket, GameSocketEvents.LIAR_CHOSE, {
      gameId: freshSession.currentGameId,
      playerId: user.telegramId,
      answer,
    });

    window.setTimeout(() => {
      offEvent(socket, SocketSystemEvents.ERROR, onError);
      setIsSubmitting(false);
      dispatch(updateTimer());
    }, 1500);
  };

  return {
    isSubmitting,
    errorText,
    chooseStrategy,
  };
}
