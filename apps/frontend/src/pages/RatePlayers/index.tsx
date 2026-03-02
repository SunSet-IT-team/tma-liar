import { type FC } from 'react';
import { GameProcess } from '../../features/GameProcess';
import { RateUsersBadge } from '../../features/UsersBadge/ui/RateUsersBadge';
import { Container } from '../../shared/ui/Container';
import { AnswersTimer } from '../../shared/ui/AnswersTimer';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/ratePlayersStyle.module.scss';
import { Button } from '../../shared/ui/Button';
import { useRateRound } from '@features/RateRound';

/**
 * Экран с оценкой других игроков
 */
export const RatePlayers: FC = () => {
  const { players, selectedIds, isSubmitting, isDone, errorText, toggleLike, confirmRate } =
    useRateRound();

  return (
    <Container>
      <Header inGame />
      <Typography as="h1" variant="titleLarge" className={styles.title}>
        Оцени!
      </Typography>
      <Typography className={styles.subtitle}>Других игроков в раунде</Typography>
      <RateUsersBadge players={players} selectedIds={selectedIds} onToggle={toggleLike} />
      <Button
        variant="buttonUnderline"
        className={styles.doneButton}
        onClick={() => confirmRate('manual')}
        disabled={isSubmitting}
      >
        {isDone ? 'Оценка завершена' : 'Готово'}
      </Button>
      {errorText ? <Typography>{errorText}</Typography> : null}
      <AnswersTimer />
      <GameProcess />
    </Container>
  );
};
