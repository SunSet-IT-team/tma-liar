import { type FC, useEffect, useMemo, useState } from 'react';
import { UserBadge } from '../../entities/user/ui/UserBadge';
import { GameProcess } from '../../features/GameProcess';
import { Container } from '../../shared/ui/Container';
import { Timer } from '../../shared/ui/Timer';
import { Typography } from '../../shared/ui/Typography';
import { AnswerSolvedBlock } from '../../widgets/AnswerSolvedBlock';
import { Header } from '../../widgets/Header';
import styles from './style/answerSolvedStyle.module.scss';
import { getCurrentTmaUser } from '../../shared/lib/tma/user';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';
import { getLobbySocket } from '../../shared/services/socket/lobby.socket';
import { toUserSocketError } from '../../shared/services/socket/socket-error';
import { PageRoutes } from '../../app/routes/pages';
import { useNavigate } from 'react-router-dom';

/**
 * Экран с вариантами ответов для решало
 */
export const AnswerSolved: FC = () => {
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
  const liarNumericId = liarPlayer?.id ? Number(liarPlayer.id) : Number.NaN;
  const liarName = liarPlayer?.nickname ?? 'Игрок';
  const liarPhoto = liarPlayer?.profileImg ?? '';
  const questionText = session?.currentQuestionText ?? 'Ожидаем вопрос...';
  const isLiar = liarId === user.telegramId;

  useEffect(() => {
    if (!session?.currentStage) return;

    if (session.currentStage === 'liar_chooses') {
      navigate(`/${isLiar ? PageRoutes.CHOOSING_LIAR : PageRoutes.WAITING_PLAYERS}`, { replace: true });
      return;
    }

    if (isLiar && session.currentStage === 'question_to_liar') {
      navigate(`/${PageRoutes.ANSWER_LIAR}`, { replace: true });
    }
  }, [isLiar, navigate, session?.currentStage]);

  useEffect(() => {
    const socket = getLobbySocket();
    const onStatusChanged = (payload: {
      diff?: {
        players?: Array<{
          id?: string;
          answer?: number | null;
          isConfirmed?: boolean | null;
        }>;
      };
    }) => {
      const me = payload.diff?.players?.find((player) => player.id === user.telegramId);
      if (!me) return;

      if (typeof me.answer === 'number') {
        setBelieve(me.answer === 1 ? true : me.answer === 0 ? false : null);
      }
      if (me.isConfirmed === true) {
        setFixed(true);
      }
    };

    socket.on('changeGameStatus', onStatusChanged);
    return () => {
      socket.off('changeGameStatus', onStatusChanged);
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
    const onError = (error: { errorCode?: string; message?: string }) => {
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
      socket.off('error', onError);
      setIsSubmitting(false);
    };

    socket.on('error', onError);
    socket.emit('game:player:voted', {
      gameId: session.currentGameId,
      playerId: user.telegramId,
      answer: value ? 1 : 0,
    });

    window.setTimeout(() => {
      socket.off('error', onError);
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
    const onError = (error: { errorCode?: string; message?: string }) => {
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

  return (
    <Container>
      <Header className={styles.header} inGame />
      <div className={styles.content}>
        <Typography as="h1" variant="titleLarge">
          Лжец
        <Typography as="span" variant="titleLarge" className={styles.titleItem}>
          ?
        </Typography>
        </Typography>
        <UserBadge
          id={Number.isNaN(liarNumericId) ? 1 : liarNumericId}
          name={liarName}
          photo={liarPhoto}
          className={styles.liarPlayer}
        />
        <Typography className={styles.questionLiar}>{questionText}</Typography>
      </div>
      <AnswerSolvedBlock
        believe={believe}
        fixed={fixed}
        onSelectBelieve={sendVote}
        onFix={secureVote}
        disabled={isSubmitting}
      />
      {errorText ? <Typography>{errorText}</Typography> : null}
      <Timer />
      <GameProcess isFixed={fixed} />
    </Container>
  );
};
