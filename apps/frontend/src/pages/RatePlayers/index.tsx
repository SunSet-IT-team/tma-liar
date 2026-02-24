import { type FC } from 'react';
import { PageRoutes } from '../../app/routes/pages';
import { GameProcess } from '../../features/GameProcess';
import { RateUsersBadge } from '../../features/UsersBadge/ui/RateUsersBadge';
import { Container } from '../../shared/ui/Container';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/ratePlayersStyle.module.scss';

/**
 * Экран с оценкой других игроков
 */
export const RatePlayers: FC = () => {
  return (
    <Container>
      <Header inGame />
      <Typography as="h1" variant="titleLarge" className={styles.title}>
        Оцени!
      </Typography>
      <Typography className={styles.subtitle}>Других игроков в раунде</Typography>
      <RateUsersBadge />
      <GameProcess route={`/${PageRoutes.RESULT_GAME}`} />
    </Container>
  );
};
