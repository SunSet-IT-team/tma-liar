import { type FC, useEffect, useState } from 'react';
import styles from '../style/waitingLobbyStyle.module.scss';
import { Header } from '../../../widgets/Header';
import { Typography } from '../../../shared/ui/Typography';
import { LobbyUsersBadge } from '../../../features/UsersBadge/ui/LobbyUsersBadge';
import { TextInput } from '../../../shared/ui/TextInput';
import { Container } from '../../../shared/ui/Container';
import { Button } from '../../../shared/ui/Button';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../../app/routes/pages';
import { useAppDispatch } from '../../../app/store/hook';
import { startTimer } from '../../../entities/game/model/timerSlice';

/**
 * Экран ожидания игроков в лобби (игрок)
 */
export const LobbyPlayer: FC = () => {
  const [ready, setReady] = useState<boolean>(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!ready) return;

    dispatch(startTimer(10));

    const timeout = setTimeout(() => {
      navigate(`/${PageRoutes.WAITING_PLAYERS}`, {
        state: {
          nextRoute: `/${PageRoutes.ANSWER_SOLVED}`,
        },
        replace: true,
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [ready, dispatch, navigate]);

  return (
    <Container className={styles.container}>
      <Header className={styles.header} />
      <div className={styles.lobbyBlock}>
        <Typography variant="titleLarge" as="h1" className={styles.lobbyTitle}>
          Лобби
          <Typography className={styles.lobbyCode}>#13HJ</Typography>
        </Typography>
      </div>
      <LobbyUsersBadge className={styles.players} />
      <div className={styles.taskBlock}>
        <Typography className={styles.taskLoserText}>Задание проигравшему</Typography>
        <TextInput
          placeholder="Task"
          value="Task"
          className={styles.taskLoserWrapper}
          inputClassName={styles.taskLoserInput}
        />
      </div>
      <Button className={styles.readyBtn} onClick={() => setReady(!ready)}>
        {ready ? 'Готов' : 'Не готов'}
      </Button>
    </Container>
  );
};
