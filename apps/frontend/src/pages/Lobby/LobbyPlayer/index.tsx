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
  getCurrentPlayerReady,
  getStageFromPayload,
  type ChangeGameStatusPayload,
} from '../../../shared/services/lobby/lobby-realtime';

const PLAYER_READY_EVENT = 'lobby:player:ready';
const CHANGE_GAME_STATUS_EVENT = 'changeGameStatus';
const LOBBY_DELETED_EVENT = 'lobby:deleted';

/**
 * Экран ожидания игроков в лобби (игрок)
 */
export const LobbyPlayer: FC = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentTmaUser(), []);
  const [session, setSession] = useState(() => lobbySessionService.get());
  const [ready, setReady] = useState<boolean>(false);

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

        const me = state.players.find((player) => player.id === user.telegramId);
        if (typeof me?.isReady === 'boolean') {
          setReady(me.isReady);
        }
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

      const currentPlayerReady = getCurrentPlayerReady(payload, user.telegramId);
      if (currentPlayerReady !== null) {
        setReady(currentPlayerReady);
      }

      const stage = getStageFromPayload(payload);

      if (stage === 'liar_chooses') {
        navigate(`/${PageRoutes.WAITING_PLAYERS}`, {
          state: {
            nextRoute: `/${PageRoutes.ANSWER_SOLVED}`,
          },
          replace: true,
        });
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
  }, [navigate, session?.lobbyCode, user.telegramId]);

  const toggleReady = () => {
    if (!session) return;

    const socket = getLobbySocket();
    const me = session.players.find((player) => player.id === user.telegramId);

    socket.emit(PLAYER_READY_EVENT, {
      lobbyCode: session.lobbyCode,
      loserTask: me?.loserTask ?? 'task',
    });
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
      <LobbyUsersBadge players={session.players} className={styles.players} currentUserId={user.telegramId} />
      <div className={styles.taskBlock}>
        <Typography className={styles.taskLoserText}>Задание проигравшему</Typography>
        <TextInput
          placeholder="Task"
          value={session.players.find((player) => player.id === user.telegramId)?.loserTask ?? 'task'}
          className={styles.taskLoserWrapper}
          inputClassName={styles.taskLoserInput}
          readOnly
        />
      </div>
      <Button className={styles.readyBtn} onClick={toggleReady}>
        {ready ? 'Готов' : 'Не готов'}
      </Button>
    </Container>
  );
};
