import { type FC, useMemo, useState } from 'react';
import { Button } from '../../shared/ui/Button';
import { Timer } from '../../shared/ui/Timer';
import styles from './style/choosingLiarStyle.module.scss';
import { Typography } from '../../shared/ui/Typography';
import { Container } from '../../shared/ui/Container';
import { GameProcess } from '../../features/GameProcess';
import { useAppDispatch } from '../../app/store/hook';
import { updateTimer } from '../../entities/game/model/timerSlice';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';
import { getLobbySocket, subscribeGameRoom } from '../../shared/services/socket/lobby.socket';
import { getCurrentTmaUser } from '../../shared/lib/tma/user';
import { toUserSocketError } from '../../shared/services/socket/socket-error';
import { findLobbyRequest } from '../../shared/services/lobby/lobby.api';

/**
 * Страница с выбором вранья лжеца
 */
export const ChoosingLiar: FC = () => {
  const dispatch = useAppDispatch();
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
        // keep existing session fallback
      }
    }

    if (!freshSession?.currentGameId) {
      setErrorText('Игра запускается, попробуйте ещё раз через секунду.');
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
      setErrorText('Не удалось получить актуальное состояние игры. Обновите страницу.');
      setIsSubmitting(false);
      return;
    }

    const socket = getLobbySocket();
    const onError = (error: { errorCode?: string; message?: string }) => {
      const code = error.errorCode ?? error.message ?? '';
      if (
        code === 'LIAR_CHOSE_ERROR' ||
        code === 'WRONG_STAGE' ||
        code === 'GAME_NOT_FOUND' ||
        code === 'LIAR_NOT_FOUND' ||
        code === 'LIAR_CHOOSE_FORBIDDEN' ||
        code === 'PLAYER_ACTION_FORBIDDEN'
      ) {
        setErrorText(toUserSocketError(error, 'Не удалось отправить выбор'));
        setIsSubmitting(false);
      }
      socket.off('error', onError);
    };

    socket.on('error', onError);
    socket.emit('game:liar:chose', {
      gameId: freshSession.currentGameId,
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
          <Button onClick={() => void chooseStrategy(true)} disabled={isSubmitting}>
            Да
          </Button>
          <Button onClick={() => void chooseStrategy(false)} disabled={isSubmitting}>
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
