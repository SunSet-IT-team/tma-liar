import { type FC } from 'react';
import styles from '../style/waitingLobbyStyle.module.scss';
import { Header } from '@widgets/Header';
import { Typography } from '@shared/ui/Typography';
import { LobbyUsersBadge } from '@features/UsersBadge';
import { TextInput } from '@shared/ui/TextInput';
import { Container } from '@shared/ui/Container';
import { ReadyToggle } from '@features/ReadyToggle';
import { useLobbyRealtimeSession } from '@features/LobbyRealtime';

/**
 * Экран ожидания игроков в лобби (игрок)
 */
export const LobbyPlayer: FC = () => {
  const { user, session, ready, loserTask, readyError, setLoserTask, setReadyError } =
    useLobbyRealtimeSession('player');

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
        <ReadyToggle
          className={styles.readyBtn}
          lobbyCode={session.lobbyCode}
          playerId={user.telegramId}
          ready={ready}
          loserTask={loserTask}
          fallbackLoserTask={
            session.players.find((player) => player.id === user.telegramId)?.loserTask ?? null
          }
          onValidationError={setReadyError}
          onBeforeToggle={() => setReadyError(null)}
        />
      </div>
    </Container>
  );
};
