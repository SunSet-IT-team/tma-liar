import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import { GameProcess } from '../../features/GameProcess';
import { RateUsersBadge } from '../../features/UsersBadge/ui/RateUsersBadge';
import { Container } from '../../shared/ui/Container';
import { AnswersTimer } from '../../shared/ui/AnswersTimer';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/ratePlayersStyle.module.scss';
import { getCurrentTmaUser } from '../../shared/lib/tma/user';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';
import { getLobbySocket } from '../../shared/services/socket/lobby.socket';
import { toUserSocketError } from '../../shared/services/socket/socket-error';
import { Button } from '../../shared/ui/Button';
import { useAppSelector } from '../../app/store/hook';

/**
 * Экран с оценкой других игроков
 */
export const RatePlayers: FC = () => {
  const user = useMemo(() => getCurrentTmaUser(), []);
  const session = lobbySessionService.get();
  const tickSeconds = useAppSelector((state) => state.timer.tickSeconds);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(
    Boolean(session?.gamePlayers?.find((player) => player.id === user.telegramId)?.isConfirmed),
  );
  const sentLikeIdsRef = useRef<Set<string>>(new Set());
  const finalizedRef = useRef(false);

  const players =
    session?.gamePlayers?.filter(
      (player) => player.id !== user.telegramId && player.id !== session.currentLiarId,
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
    const onError = (error: { errorCode?: string; message?: string }) => {
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
      socket.off('error', onError);
    };

    socket.on('error', onError);
    for (const receiverId of pendingIds) {
      sentLikeIdsRef.current.add(receiverId);
      socket.emit('game:player:liked', {
        gameId: session.currentGameId,
        senderId: user.telegramId,
        receiverId,
      });
    }

    window.setTimeout(() => {
      socket.off('error', onError);
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
    const onError = (error: { errorCode?: string; message?: string }) => {
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
      socket.off('error', onError);
      setIsSubmitting(false);
    };

    socket.on('error', onError);
    socket.emit('game:player:secured', {
      gameId: session.currentGameId,
      playerId: user.telegramId,
    });

    window.setTimeout(() => {
      socket.off('error', onError);
      setIsSubmitting(false);
    }, 900);
  };

  useEffect(() => {
    if (!isDone && tickSeconds !== null && tickSeconds <= 0) {
      confirmRate('timeout');
    }
  }, [tickSeconds, isDone]);

  return (
    <Container>
      <Header inGame />
      <Typography as="h1" variant="titleLarge" className={styles.title}>
        Оцени!
      </Typography>
      <Typography className={styles.subtitle}>Других игроков в раунде</Typography>
      <RateUsersBadge players={players} selectedIds={selectedIds} onToggle={toggleLike} />
      <Button
        variant="buttonUnderline"
        className={styles.doneButton}
        onClick={() => confirmRate('manual')}
        disabled={isSubmitting}
      >
        {isDone ? 'Оценка завершена' : 'Готово'}
      </Button>
      {errorText ? <Typography>{errorText}</Typography> : null}
      <AnswersTimer />
      <GameProcess />
    </Container>
  );
};
