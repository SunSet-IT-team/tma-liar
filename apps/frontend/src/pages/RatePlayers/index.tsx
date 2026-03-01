import { type FC, useMemo, useState } from 'react';
import { GameProcess } from '../../features/GameProcess';
import { RateUsersBadge } from '../../features/UsersBadge/ui/RateUsersBadge';
import { Container } from '../../shared/ui/Container';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/ratePlayersStyle.module.scss';
import { getCurrentTmaUser } from '../../shared/lib/tma/user';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';
import { getLobbySocket } from '../../shared/services/socket/lobby.socket';

/**
 * Экран с оценкой других игроков
 */
export const RatePlayers: FC = () => {
  const user = useMemo(() => getCurrentTmaUser(), []);
  const session = lobbySessionService.get();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const players =
    session?.gamePlayers?.filter(
      (player) => player.id !== user.telegramId && player.id !== session.currentLiarId,
    ) ?? [];

  const toggleLike = (playerId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(playerId)) {
        return prev;
      }

      const socket = getLobbySocket();
      if (session?.currentGameId) {
        socket.emit('game:player:liked', {
          gameId: session.currentGameId,
          senderId: user.telegramId,
          receiverId: playerId,
        });
      }

      return [...prev, playerId];
    });
  };

  return (
    <Container>
      <Header inGame />
      <Typography as="h1" variant="titleLarge" className={styles.title}>
        Оцени!
      </Typography>
      <Typography className={styles.subtitle}>Других игроков в раунде</Typography>
      <RateUsersBadge players={players} selectedIds={selectedIds} onToggle={toggleLike} />
      <GameProcess />
    </Container>
  );
};
