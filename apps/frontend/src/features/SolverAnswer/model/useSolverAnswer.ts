import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameSocketEvents } from '@common/message-types/events/game.events';
import { SocketSystemEvents } from '@common/message-types/events/socket.events';
import type { GameStatusChangedPayload } from '@common/message-types/contracts/game.contracts';
import type { SocketErrorPayload } from '@common/message-types/contracts/socket.contracts';
import { PageRoutes } from '@app/routes/pages';
import { getCurrentTmaUser } from '@shared/lib/tma/user';
import { lobbySessionService } from '@shared/services/lobby/lobby-session.service';
import { getLobbySocket } from '@shared/services/socket/lobby.socket';
import { toUserSocketError } from '@shared/services/socket/socket-error';

export function useSolverAnswer() {
  const navigate = useNavigate();
  const [believe, setBelieve] = useState<boolean | null>(null);
  const [fixed, setFixed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const user = useMemo(() => getCurrentTmaUser(), []);
  const session = lobbySessionService.get();
  const liarId = session?.currentLiarId ?? null;
  const liarPlayer =
    session?.gamePlayers?.find((player) => player.id === liarId) ??
    session?.players.find((player) => player.id === liarId);

  useEffect(() => {
    if (!session?.currentStage) return;

    if (session.currentStage === 'liar_chooses') {
      navigate(`/${liarId === user.telegramId ? PageRoutes.CHOOSING_LIAR : PageRoutes.WAITING_PLAYERS}`, {
        replace: true,
      });
      return;
    }

    if (liarId === user.telegramId && session.currentStage === 'question_to_liar') {
      navigate(`/${PageRoutes.ANSWER_LIAR}`, { replace: true });
    }
  }, [liarId, navigate, session?.currentStage, user.telegramId]);

  useEffect(() => {
    const socket = getLobbySocket();
    const onStatusChanged = (payload: GameStatusChangedPayload) => {
      const me = payload.diff?.players?.find((player) => player.id === user.telegramId);
      if (!me) return;

      if (typeof me.answer === 'number') {
        setBelieve(me.answer === 1 ? true : me.answer === 0 ? false : null);
      }
      if (me.isConfirmed === true) {
        setFixed(true);
      }
    };

    socket.on(SocketSystemEvents.STATUS_CHANGED, onStatusChanged);
    return () => {
      socket.off(SocketSystemEvents.STATUS_CHANGED, onStatusChanged);
    };
  }, [user.telegramId]);

  const sendVote = (value: boolean) => {
    if (fixed || isSubmitting) return;
    if (!session?.currentGameId) {
      setErrorText('Игра не найдена. Обновите страницу.');
      return;
    }

    setErrorText(null);
    setBelieve(value);
    setIsSubmitting(true);

    const socket = getLobbySocket();
    const onError = (error: SocketErrorPayload) => {
      const code = error.errorCode ?? error.message ?? '';
      if (
        code === 'PLAYER_VOTED_ERROR' ||
        code === 'WRONG_STAGE' ||
        code === 'LIAR_CANNOT_VOTE' ||
        code === 'PLAYER_ACTION_FORBIDDEN' ||
        code === 'ANSWER_ALREADY_CONFIRMED'
      ) {
        setErrorText(toUserSocketError(error, 'Не удалось отправить выбор'));
      }
      socket.off(SocketSystemEvents.ERROR, onError);
      setIsSubmitting(false);
    };

    socket.on(SocketSystemEvents.ERROR, onError);
    socket.emit(GameSocketEvents.PLAYER_VOTED, {
      gameId: session.currentGameId,
      playerId: user.telegramId,
      answer: value ? 1 : 0,
    });

    window.setTimeout(() => {
      socket.off(SocketSystemEvents.ERROR, onError);
      setIsSubmitting(false);
    }, 900);
  };

  const secureVote = () => {
    if (believe === null || fixed || isSubmitting) return;
    if (!session?.currentGameId) {
      setErrorText('Игра не найдена. Обновите страницу.');
      return;
    }

    setErrorText(null);
    setFixed(true);
    setIsSubmitting(true);

    const socket = getLobbySocket();
    const onError = (error: SocketErrorPayload) => {
      const code = error.errorCode ?? error.message ?? '';
      if (
        code === 'PLAYER_SECURED_ERROR' ||
        code === 'WRONG_STAGE' ||
        code === 'LIAR_CANNOT_SECURE' ||
        code === 'PLAYER_DIDNT_ANSWER' ||
        code === 'PLAYER_ACTION_FORBIDDEN' ||
        code === 'ANSWER_ALREADY_CONFIRMED'
      ) {
        setErrorText(toUserSocketError(error, 'Не удалось зафиксировать ответ'));
        setFixed(false);
      }
      socket.off(SocketSystemEvents.ERROR, onError);
      setIsSubmitting(false);
    };

    socket.on(SocketSystemEvents.ERROR, onError);
    socket.emit(GameSocketEvents.PLAYER_SECURED, {
      gameId: session.currentGameId,
      playerId: user.telegramId,
    });

    window.setTimeout(() => {
      socket.off(SocketSystemEvents.ERROR, onError);
      setIsSubmitting(false);
    }, 900);
  };

  return {
    session,
    liarId,
    liarPlayer,
    believe,
    fixed,
    isSubmitting,
    errorText,
    sendVote,
    secureVote,
  };
}
