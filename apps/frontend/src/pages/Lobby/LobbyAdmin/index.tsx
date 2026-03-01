import { type FC, useEffect, useMemo, useState } from 'react';
import styles from '../style/waitingLobbyStyle.module.scss';
import { Header } from '../../../widgets/Header';
import { Typography } from '../../../shared/ui/Typography';
import { LobbyUsersBadge } from '../../../features/UsersBadge/ui/LobbyUsersBadge';
import { TextInput } from '../../../shared/ui/TextInput';
import { Container } from '../../../shared/ui/Container';
import { Button } from '../../../shared/ui/Button';
import { ReadyToggle } from '../../../features/ReadyToggle/ui';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../../app/routes/pages';
import { lobbySessionService } from '../../../shared/services/lobby/lobby-session.service';
import { getCurrentTmaUser } from '../../../shared/lib/tma/user';
import { getLobbySocket, subscribeLobbyRoom } from '../../../shared/services/socket/lobby.socket';
import {
  applyLobbyDiff,
  type ChangeGameStatusPayload,
} from '../../../shared/services/lobby/lobby-realtime';

const GAME_STARTED_EVENT = 'game:started';
const PLAYER_READY_EVENT = 'lobby:player:ready';
const CHANGE_GAME_STATUS_EVENT = 'changeGameStatus';
const LOBBY_DELETED_EVENT = 'lobby:deleted';
const ERROR_EVENT = 'error';
const MIN_PLAYERS_TO_START = 3;

function isValidLoserTask(task: string | null | undefined): boolean {
  if (typeof task !== 'string') return false;
  const normalized = task.trim();
  if (!normalized) return false;
  if (normalized.toLowerCase() === 'task') return false;
  return true;
}

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
  const [readyError, setReadyError] = useState<string | null>(null);
  const adminPlayer = session?.players.find((player) => player.id === user.telegramId);
  const adminReady = Boolean(adminPlayer?.isReady);
  const allPlayersReady = session ? session.players.every((player) => player.isReady) : false;
  const enoughPlayers = session ? session.players.length >= MIN_PLAYERS_TO_START : false;
  const allPlayersHaveTask = session ? session.players.every((player) => isValidLoserTask(player.loserTask)) : false;

  const syncLobbyState = (state: {
    lobbyCode: string;
    adminId: string;
    currentGameId?: string | null;
    status: string;
    players: {
      id: string;
      nickname: string;
      profileImg?: string;
      isReady?: boolean;
      loserTask?: string | null;
    }[];
  }) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        adminId: state.adminId,
        currentGameId: state.currentGameId ?? prev.currentGameId,
        status: state.status,
        players: state.players,
      };
      lobbySessionService.set(next);
      return next;
    });
  };

  useEffect(() => {
    if (!session?.lobbyCode) {
      navigate('/');
      return;
    }

    const socket = getLobbySocket();
    const lobbyCode = session.lobbyCode;

    void subscribeLobbyRoom(lobbyCode)
      .then((state) => {
        const meInLobby = state.players.some((player) => player.id === user.telegramId);
        if (!meInLobby) {
          lobbySessionService.clear();
          navigate('/', { replace: true });
          return;
        }

        syncLobbyState(state);

        if (state.adminId !== user.telegramId) {
          navigate(`/${PageRoutes.LOBBY_PLAYER}`, { replace: true });
        }
      })
      .catch(() => {
        navigate('/', { replace: true });
      });

    const onGameStatusChanged = (payload: ChangeGameStatusPayload) => {
      setSession((prev) => {
        if (!prev) return prev;

        const next = applyLobbyDiff(prev, payload);
        lobbySessionService.set(next);
        return next;
      });

      const nextAdminId = payload.diff?.adminId;
      if (nextAdminId && nextAdminId !== user.telegramId) {
        navigate(`/${PageRoutes.LOBBY_PLAYER}`, { replace: true });
        return;
      }
    };

    const onLobbyDeleted = () => {
      void subscribeLobbyRoom(lobbyCode)
        .then((state) => {
          const meInLobby = state.players.some((player) => player.id === user.telegramId);
          if (!meInLobby) {
            lobbySessionService.clear();
            navigate('/', { replace: true });
            return;
          }
          syncLobbyState(state);
        })
        .catch(() => {
          lobbySessionService.clear();
          navigate('/', { replace: true });
        });
    };

    const onSocketError = (error: { errorCode?: string; message?: string }) => {
      const code = error.errorCode ?? error.message ?? '';
      if (
        code === 'PLAYER_READY_ERROR' ||
        code === 'USER_NOT_FOUND_OR_LOBBY_EMPTY' ||
        code === 'PLAYER_READY_FORBIDDEN'
      ) {
        setReadyError(`Не удалось изменить готовность (${code}). Обновите страницу и попробуйте снова.`);
      }
    };

    socket.on(CHANGE_GAME_STATUS_EVENT, onGameStatusChanged);
    socket.on(LOBBY_DELETED_EVENT, onLobbyDeleted);
    socket.on(ERROR_EVENT, onSocketError);

    return () => {
      socket.off(CHANGE_GAME_STATUS_EVENT, onGameStatusChanged);
      socket.off(LOBBY_DELETED_EVENT, onLobbyDeleted);
      socket.off(ERROR_EVENT, onSocketError);
    };
  }, [navigate, session?.lobbyCode]);

  const startGame = () => {
    if (!session || isStarting) return;

    setIsStarting(true);
    setStartError(null);

    const socket = getLobbySocket();
    const onError = (error: { errorCode?: string; message?: string }) => {
      const code = error.errorCode ?? error.message ?? 'GAME_START_ERROR';
      if (code === 'PLAYER_IS_NOT_ADMIN') {
        setStartError('Вы больше не админ этого лобби. Открывается экран игрока.');
        void subscribeLobbyRoom(session.lobbyCode)
          .then((state) => {
            syncLobbyState(state);
            navigate(`/${PageRoutes.LOBBY_PLAYER}`, { replace: true });
          })
          .catch(() => {
            navigate('/', { replace: true });
          });
      } else if (code === 'NOT_ALL_PLAYERS_READY') {
        setStartError('Не удалось начать игру: не все игроки готовы.');
        void subscribeLobbyRoom(session.lobbyCode)
          .then((state) => {
            syncLobbyState(state);
          })
          .catch(() => undefined);
      } else {
        setStartError(`Не удалось начать игру (${code}).`);
      }

      setIsStarting(false);
      socket.off(ERROR_EVENT, onError);
    };

    socket.on(ERROR_EVENT, onError);
    socket.emit(GAME_STARTED_EVENT, { lobbyCode: session.lobbyCode });

    window.setTimeout(() => {
      socket.off(ERROR_EVENT, onError);
      setIsStarting(false);
    }, 5000);
  };

  const toggleReady = () => {
    if (!session) return;
    const normalizedTask = loserTask.trim();
    if (!adminReady && !isValidLoserTask(normalizedTask)) {
      setReadyError('Сначала придумайте задание проигравшему.');
      return;
    }

    const socket = getLobbySocket();
    setReadyError(null);
    socket.emit(PLAYER_READY_EVENT, {
      lobbyCode: session.lobbyCode,
      playerId: adminPlayer?.id,
      loserTask: normalizedTask || adminPlayer?.loserTask || null,
    });
  };

  const startBlockReason = !enoughPlayers
    ? 'Недостаточно игроков'
    : !allPlayersReady
      ? 'Не все игроки готовы'
      : !allPlayersHaveTask
        ? 'Нужно задание проигравшему'
        : null;

  if (!session) return null;

  return (
    <Container className={styles.container}>
      <Header className={styles.header} inGame />
      <div className={styles.lobbyBlock}>
        <Typography variant="titleLarge" as="h1" className={styles.lobbyTitle}>
          Лобби
        </Typography>
        <Typography className={styles.lobbyCode}>#{session.lobbyCode}</Typography>
      </div>
      <LobbyUsersBadge
        playersClassName={styles.lobbyPlayers}
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
      <Typography className={styles.statusHint}>
        Готовы: {session.players.filter((player) => player.isReady).length}/{session.players.length}
      </Typography>
      {startError ? <Typography className={styles.errorText}>{startError}</Typography> : null}
      {readyError ? <Typography className={styles.errorText}>{readyError}</Typography> : null}
      <div className={styles.actions}>
        <ReadyToggle className={styles.readyBtn} ready={adminReady} onToggle={toggleReady} />
        {startBlockReason ? (
          <Typography className={styles.statusHint}>{startBlockReason}</Typography>
        ) : (
          <Button className={`${styles.readyBtn} ${styles.secondaryAction}`} onClick={startGame} disabled={isStarting}>
            {isStarting ? 'Запуск...' : 'Начать'}
          </Button>
        )}
      </div>
    </Container>
  );
};
