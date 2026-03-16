import { useEffect, useMemo, useRef, useState } from 'react';
import { GameSocketEvents } from '@liar/message-types';
import { SocketSystemEvents } from '@liar/message-types';
import type { SocketErrorPayload } from '@liar/message-types';
import { useAppSelector } from '@app/store/hook';
import { getCurrentUser, getCurrentUserId } from '@shared/lib/tma/user';
import { lobbySessionService } from '@shared/services/lobby/lobby-session.service';
import { getLobbySocket } from '@shared/services/socket/lobby.socket';
import { toUserSocketError } from '@shared/services/socket/socket-error';
import { emitEvent, offEvent, onEvent } from '@shared/services/socket/typed-socket';

export function useRateRound() {
  const user = useMemo(() => getCurrentUser(), []);
  const session = lobbySessionService.get();
  const tickSeconds = useAppSelector((state) => state.timer.tickSeconds);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(
    Boolean(
      session?.gamePlayers?.find((player) => player.id === getCurrentUserId(user))?.isConfirmed,
    ),
  );
  const sentLikeIdsRef = useRef<Set<string>>(new Set());
  const finalizedRef = useRef(false);

  const players =
    session?.gamePlayers?.filter(
      (player) => player.id !== getCurrentUserId(user) && player.id !== session.currentLiarId,
    ) ?? [];

  const toggleLike = (playerId: string, checked: boolean) => {
    if (isDone || isSubmitting) return;

    setSelectedIds((prev) => {
      if (!checked) {
        return prev.filter((id) => id !== playerId);
      }
      if (prev.includes(playerId)) return prev;

      return [...prev, playerId];
    });
  };

  const sendPendingLikes = () => {
    if (!session?.currentGameId) return;

    const pendingIds = selectedIds.filter((id) => !sentLikeIdsRef.current.has(id));
    if (pendingIds.length === 0) return;

    const socket = getLobbySocket();
    const onError = (error: SocketErrorPayload) => {
      const code = error.errorCode ?? error.message ?? '';
      if (
        code === 'PLAYER_LIKED_ERROR' ||
        code === 'LIKE_ALREADY_SENT' ||
        code === 'RECEIVER_EQUALS_LIAR_IDS' ||
        code === 'RECEIVER_EQUALS_SENDER_IDS' ||
        code === 'SENDER_DIDNT_ANSWER' ||
        code === 'PLAYER_ACTION_FORBIDDEN' ||
        code === 'WRONG_STAGE'
      ) {
        setErrorText(toUserSocketError(error, 'Не удалось поставить лайк'));
      }
      offEvent(socket, SocketSystemEvents.ERROR, onError);
    };

    onEvent(socket, SocketSystemEvents.ERROR, onError);
    for (const receiverId of pendingIds) {
      sentLikeIdsRef.current.add(receiverId);
      emitEvent(socket, GameSocketEvents.PLAYER_LIKED, {
        gameId: session.currentGameId,
        senderId: getCurrentUserId(user),
        receiverId,
      });
    }

    window.setTimeout(() => {
      offEvent(socket, SocketSystemEvents.ERROR, onError);
    }, 900);
  };

  const confirmRate = (source: 'manual' | 'timeout' = 'manual') => {
    if (finalizedRef.current || isDone || isSubmitting) return;
    if (!session?.currentGameId) {
      setErrorText('Игра не найдена. Обновите страницу.');
      return;
    }

    finalizedRef.current = true;
    setErrorText(null);
    setIsDone(true);
    setIsSubmitting(true);
    sendPendingLikes();

    const socket = getLobbySocket();
    const onError = (error: SocketErrorPayload) => {
      const code = error.errorCode ?? error.message ?? '';
      if (
        code === 'PLAYER_SECURED_ERROR' ||
        code === 'WRONG_STAGE' ||
        code === 'PLAYER_ACTION_FORBIDDEN' ||
        code === 'ANSWER_ALREADY_CONFIRMED'
      ) {
        if (source === 'manual') {
          setErrorText(toUserSocketError(error, 'Не удалось завершить оценку'));
          setIsDone(false);
          finalizedRef.current = false;
        }
      }
      offEvent(socket, SocketSystemEvents.ERROR, onError);
      setIsSubmitting(false);
    };

    onEvent(socket, SocketSystemEvents.ERROR, onError);
    emitEvent(socket, GameSocketEvents.PLAYER_SECURED, {
      gameId: session.currentGameId,
      playerId: getCurrentUserId(user),
    });

    window.setTimeout(() => {
      offEvent(socket, SocketSystemEvents.ERROR, onError);
      setIsSubmitting(false);
    }, 900);
  };

  useEffect(() => {
    if (!isDone && tickSeconds !== null && tickSeconds <= 0) {
      confirmRate('timeout');
    }
  }, [tickSeconds, isDone]);

  return {
    players,
    selectedIds,
    isSubmitting,
    isDone,
    errorText,
    toggleLike,
    confirmRate,
  };
}
