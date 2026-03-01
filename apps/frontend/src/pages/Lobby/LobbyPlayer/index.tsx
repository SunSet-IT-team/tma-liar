import { type FC, useEffect, useMemo, useState } from 'react';
import styles from '../style/waitingLobbyStyle.module.scss';
import { Header } from '../../../widgets/Header';
import { Typography } from '../../../shared/ui/Typography';
import { LobbyUsersBadge } from '../../../features/UsersBadge/ui/LobbyUsersBadge';
import { TextInput } from '../../../shared/ui/TextInput';
import { Container } from '../../../shared/ui/Container';
import { ReadyToggle } from '../../../features/ReadyToggle/ui';
import { useNavigate } from 'react-router-dom';
import { lobbySessionService } from '../../../shared/services/lobby/lobby-session.service';
import { getCurrentTmaUser } from '../../../shared/lib/tma/user';
import { getLobbySocket, subscribeLobbyRoom } from '../../../shared/services/socket/lobby.socket';
import {
  applyLobbyDiff,
  getCurrentPlayerReady,
  type ChangeGameStatusPayload,
} from '../../../shared/services/lobby/lobby-realtime';

const PLAYER_READY_EVENT = 'lobby:player:ready';
const CHANGE_GAME_STATUS_EVENT = 'changeGameStatus';
const LOBBY_DELETED_EVENT = 'lobby:deleted';
const ERROR_EVENT = 'error';

function isValidLoserTask(task: string | null | undefined): boolean {
  if (typeof task !== 'string') return false;
  const normalized = task.trim();
  if (!normalized) return false;
  if (normalized.toLowerCase() === 'task') return false;
  return true;
}

/**
 * Экран ожидания игроков в лобби (игрок)
 */
export const LobbyPlayer: FC = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentTmaUser(), []);
  const [session, setSession] = useState(() => lobbySessionService.get());
  const [ready, setReady] = useState<boolean>(false);
  const [loserTask, setLoserTask] = useState<string>('task');
  const [readyError, setReadyError] = useState<string | null>(null);

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

        const me = state.players.find((player) => player.id === user.telegramId);
        if (typeof me?.isReady === 'boolean') {
          setReady(me.isReady);
        }
        if (typeof me?.loserTask === 'string') {
          setLoserTask(me.loserTask);
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

      const currentPlayerReady = getCurrentPlayerReady(payload, user.telegramId);
      if (currentPlayerReady !== null) {
        setReady(currentPlayerReady);
      }

      const currentPlayer = payload.diff?.players?.find((player) => player.id === user.telegramId);
      if (typeof currentPlayer?.loserTask === 'string') {
        setLoserTask(currentPlayer.loserTask);
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
  }, [navigate, session?.lobbyCode, user.telegramId]);

  const toggleReady = () => {
    if (!session) return;

    const normalizedTask = loserTask.trim();
    if (!ready && !isValidLoserTask(normalizedTask)) {
      setReadyError('Сначала придумайте задание проигравшему.');
      return;
    }

    const socket = getLobbySocket();
    const me = session.players.find((player) => player.id === user.telegramId);
    setReadyError(null);

    socket.emit(PLAYER_READY_EVENT, {
      lobbyCode: session.lobbyCode,
      playerId: me?.id ?? user.telegramId,
      loserTask: normalizedTask || me?.loserTask || null,
    });
  };

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
          value={loserTask}
          onChange={(event) => setLoserTask(event.target.value)}
          className={styles.taskLoserWrapper}
          inputClassName={styles.taskLoserInput}
        />
      </div>
      <Typography className={styles.statusHint}>
        Готовы: {session.players.filter((player) => player.isReady).length}/{session.players.length}
      </Typography>
      {readyError ? <Typography className={styles.errorText}>{readyError}</Typography> : null}
      <div className={styles.actions}>
        <ReadyToggle className={styles.readyBtn} ready={ready} onToggle={toggleReady} />
      </div>
    </Container>
  );
};
