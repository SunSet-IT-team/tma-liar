import { type FC } from 'react';
import { AnswersUserBadge } from '../../features/UsersBadge/ui/AnswersUsersBadge';
import { Button } from '../../shared/ui/Button';
import { Container } from '../../shared/ui/Container';
import { AnswersTimer } from '../../shared/ui/AnswersTimer';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/answersPlayersStyle.module.scss';
import { GameProcess } from '../../features/GameProcess';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';

/**
 * Экран с ответами других игроков
 */
export const AnswersPlayers: FC = () => {
  const session = lobbySessionService.get();
  const liarId = session?.currentLiarId ?? null;
  const players =
    session?.gamePlayers
      ?.filter((player) => player.id !== liarId)
      .map((player) => ({
        id: player.id,
        nickname: player.nickname,
        profileImg: player.profileImg,
        answer: player.answer,
      })) ?? [];

  return (
    <Container>
      <Header inGame />
      <Typography as="h1" variant="titleLarge" className={styles.title}>
        Игроки
      </Typography>
      <Typography className={styles.answersText}>и их ответы</Typography>
      <AnswersUserBadge className={styles.answersPlayers} players={players} />
      <div className={styles.bottomBlock}>
        <Button className={styles.nextBtn} disabled>
          Ожидание раунда...
        </Button>
        <AnswersTimer className={styles.time} />
      </div>
      <GameProcess />
    </Container>
  );
};
