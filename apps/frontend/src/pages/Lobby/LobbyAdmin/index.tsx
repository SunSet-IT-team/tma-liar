import { type FC, useEffect, useMemo, useState } from 'react';
import styles from '../style/waitingLobbyStyle.module.scss';
import { Header } from '../../../widgets/Header';
import { Typography } from '../../../shared/ui/Typography';
import { LobbyUsersBadge } from '../../../features/UsersBadge/ui/LobbyUsersBadge';
import { TextInput } from '../../../shared/ui/TextInput';
import { Container } from '../../../shared/ui/Container';
import { Button } from '../../../shared/ui/Button';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../../app/routes/pages';
import { lobbySessionService } from '../../../shared/services/lobby/lobby-session.service';
import { getCurrentTmaUser } from '../../../shared/lib/tma/user';
import { getLobbySocket, subscribeLobbyRoom } from '../../../shared/services/socket/lobby.socket';
import {
  applyLobbyDiff,
  getStageFromPayload,
  type ChangeGameStatusPayload,
} from '../../../shared/services/lobby/lobby-realtime';

const GAME_STARTED_EVENT = 'game:started';
const CHANGE_GAME_STATUS_EVENT = 'changeGameStatus';
const LOBBY_DELETED_EVENT = 'lobby:deleted';
const ERROR_EVENT = 'error';

/**
 * Экран ожидания игроков в лобби (админ)
 */
export const LobbyAdmin: FC = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentTmaUser(), []);
  const [session, setSession] = useState(() => lobbySessionService.get());
  const [loserTask, setLoserTask] = useState('task');
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const allPlayersReady = session ? session.players.every((player) => player.isReady) : false;

  useEffect(() => {
    if (!session?.lobbyCode) {
      navigate('/');
      return;
    }

    const socket = getLobbySocket();
    const lobbyCode = session.lobbyCode;

    void subscribeLobbyRoom(lobbyCode)
      .then((state) => {
        setSession((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            adminId: state.adminId,
            status: state.status,
            players: state.players,
          };
          lobbySessionService.set(next);
          return next;
        });
      })
      .catch(() => {
        navigate('/');
      });

    const onGameStatusChanged = (payload: ChangeGameStatusPayload) => {
      setSession((prev) => {
        if (!prev) return prev;

        const next = applyLobbyDiff(prev, payload);
        lobbySessionService.set(next);
        return next;
      });

      const stage = getStageFromPayload(payload);

      if (stage === 'liar_chooses') {
        navigate(`/${PageRoutes.CHOOSING_LIAR}`);
      }
    };

    const onLobbyDeleted = () => {
      lobbySessionService.clear();
      navigate('/');
    };

    socket.on(CHANGE_GAME_STATUS_EVENT, onGameStatusChanged);
    socket.on(LOBBY_DELETED_EVENT, onLobbyDeleted);

    return () => {
      socket.off(CHANGE_GAME_STATUS_EVENT, onGameStatusChanged);
      socket.off(LOBBY_DELETED_EVENT, onLobbyDeleted);
    };
  }, [navigate, session?.lobbyCode]);

  const startGame = () => {
    if (!session || isStarting) return;

    setIsStarting(true);
    setStartError(null);

    const socket = getLobbySocket();
    const onError = (error: { errorCode?: string; message?: string }) => {
      if (error.errorCode !== 'GAME_START_ERROR' && error.errorCode !== 'PLAYER_IS_NOT_ADMIN') {
        return;
      }
      setStartError('Не удалось начать игру. Убедитесь, что все игроки готовы.');
      setIsStarting(false);
      socket.off(ERROR_EVENT, onError);
    };

    socket.on(ERROR_EVENT, onError);
    socket.emit(GAME_STARTED_EVENT, { lobbyCode: session.lobbyCode });

    window.setTimeout(() => {
      socket.off(ERROR_EVENT, onError);
      setIsStarting(false);
    }, 1500);
  };

  if (!session) return null;

  return (
    <Container className={styles.container}>
      <Header className={styles.header} />
      <div className={styles.lobbyBlock}>
        <Typography variant="titleLarge" as="h1" className={styles.lobbyTitle}>
          Лобби
          <Typography className={styles.lobbyCode}>#{session.lobbyCode}</Typography>
        </Typography>
      </div>
      <LobbyUsersBadge
        playersClassName={styles.lobbyPlayers}
        className={styles.players}
        players={session.players}
        currentUserId={user.telegramId}
      />
      <div className={styles.taskBlock}>
        <Typography className={styles.taskLoserText}>Задание проигравшему</Typography>
        <TextInput
          placeholder="Task"
          className={styles.taskLoserWrapper}
          inputClassName={styles.taskLoserInput}
          value={loserTask}
          onChange={(event) => setLoserTask(event.target.value)}
        />
        <Typography className={styles.connectedPlayers}>{session.players.length}/7</Typography>
      </div>
      {startError ? <Typography>{startError}</Typography> : null}
      <Button className={styles.readyBtn} onClick={startGame} disabled={isStarting || !allPlayersReady}>
        {isStarting ? 'Запуск...' : 'Начать'}
      </Button>
    </Container>
  );
};
