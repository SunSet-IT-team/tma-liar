import { type FC, useMemo, useState } from 'react';
import { Button } from '../../shared/ui/Button';
import { Timer } from '../../shared/ui/Timer';
import styles from './style/choosingLiarStyle.module.scss';
import { Typography } from '../../shared/ui/Typography';
import { Container } from '../../shared/ui/Container';
import { GameProcess } from '../../features/GameProcess';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/store/hook';
import { updateTimer } from '../../entities/game/model/timerSlice';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';
import { getLobbySocket } from '../../shared/services/socket/lobby.socket';
import { getCurrentTmaUser } from '../../shared/lib/tma/user';

/**
 * Страница с выбором вранья лжеца
 */
export const ChoosingLiar: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const user = useMemo(() => getCurrentTmaUser(), []);
  const session = lobbySessionService.get();
  const isCurrentLiar = session?.currentLiarId === user.telegramId;

  const chooseStrategy = (answer: boolean) => {
    if (isSubmitting) return;
    if (!session?.currentGameId) {
      navigate('/', { replace: true });
      return;
    }
    if (!isCurrentLiar) {
      setErrorText('Вы не лжец в этом раунде.');
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);

    const socket = getLobbySocket();
    const onError = (error: { errorCode?: string; message?: string }) => {
      const code = error.errorCode ?? error.message ?? '';
      if (
        code === 'LIAR_CHOSE_ERROR' ||
        code === 'WRONG_STAGE' ||
        code === 'GAME_NOT_FOUND' ||
        code === 'LIAR_NOT_FOUND'
      ) {
        setErrorText(`Не удалось отправить выбор (${code}).`);
        setIsSubmitting(false);
      }
      socket.off('error', onError);
    };

    socket.on('error', onError);
    socket.emit('game:liar:chose', {
      gameId: session.currentGameId,
      playerId: user.telegramId,
      answer,
    });

    window.setTimeout(() => {
      socket.off('error', onError);
      setIsSubmitting(false);
      dispatch(updateTimer());
    }, 1500);
  };

  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <Typography className={styles.title} variant="titleLarge" as="h1">
          Будешь врать?
        </Typography>
        <div className={styles.choosingBtns}>
          <Button onClick={() => chooseStrategy(true)} disabled={isSubmitting || !isCurrentLiar}>
            Да
          </Button>
          <Button onClick={() => chooseStrategy(false)} disabled={isSubmitting || !isCurrentLiar}>
            Нет
          </Button>
        </div>
        {errorText ? <Typography>{errorText}</Typography> : null}
      </div>
      <GameProcess />
      <Timer />
    </Container>
  );
};
