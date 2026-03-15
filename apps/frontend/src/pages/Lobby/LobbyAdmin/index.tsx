import { type FC, useEffect } from 'react';
import styles from '../style/waitingLobbyStyle.module.scss';
import { Header } from '@widgets/Header';
import { Typography } from '@shared/ui/Typography';
import { LobbyUsersBadge } from '@features/UsersBadge';
import { TextInput } from '@shared/ui/TextInput';
import { Container } from '@shared/ui/Container';
import { ReadyToggle } from '@features/ReadyToggle';
import { useLobbyRealtimeSession } from '@features/LobbyRealtime';
import { useStartGame } from '@features/StartGame';
import { getCurrentUserId } from '@shared/lib/tma/user';

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
  const { user, session, loserTask, readyError, setLoserTask, setReadyError, syncLobbyState } =
    useLobbyRealtimeSession('admin');
  const { isStarting, startError, startGame } = useStartGame({
    lobbyCode: session?.lobbyCode,
    onSyncLobbyState: syncLobbyState,
  });
  const adminPlayer = session?.players.find((player) => player.id === getCurrentUserId(user));
  const adminReady = Boolean(adminPlayer?.isReady);
  const allPlayersReady = session ? session.players.every((player) => player.isReady) : false;
  const enoughPlayers = session ? session.players.length >= MIN_PLAYERS_TO_START : false;
  const allPlayersHaveTask = session
    ? session.players.every((player) => isValidLoserTask(player.loserTask))
    : false;

  const toggleReady = () => {
    setReadyError(null);
  };

  const startBlockReason = !enoughPlayers
    ? 'Недостаточно игроков'
    : !allPlayersReady
      ? 'Не все игроки готовы'
      : !allPlayersHaveTask
        ? 'Нужно задание проигравшему'
        : null;

  useEffect(() => {
    if (!session) return;
    if (session.status === 'started') return;
    if (isStarting) return;
    if (startBlockReason) return;
    startGame();
  }, [isStarting, session, startBlockReason, startGame]);

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
        currentUserId={getCurrentUserId(user)}
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
        <ReadyToggle
          className={styles.readyBtn}
          lobbyCode={session.lobbyCode}
          playerId={adminPlayer?.id ?? getCurrentUserId(user)}
          ready={adminReady}
          loserTask={loserTask}
          fallbackLoserTask={adminPlayer?.loserTask ?? null}
          onValidationError={setReadyError}
          onBeforeToggle={toggleReady}
        />
        <Typography className={styles.statusHint}>
          {startBlockReason ?? (isStarting ? 'Запуск игры...' : 'Игра запускается автоматически')}
        </Typography>
      </div>
    </Container>
  );
};
