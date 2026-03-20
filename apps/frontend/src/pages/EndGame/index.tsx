import { type FC } from 'react';
import { EndGameUsersBadgeWithPoints } from '../../features/UsersBadge/ui/EndGameUsersBadgeWithPoints';
import { Button } from '../../shared/ui/Button';
import { Container } from '../../shared/ui/Container';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/endGameStyle.module.scss';
import endIcon from '/icons/endIcon2.svg';
import { useEndGameFlow } from '@features/EndGameFlow';

/**
 * Экран, конец игры
 */
export const EndGame: FC = () => {
  const { myPlace, errorText, isSubmitting, handlePlayAgain, handleExitHome } = useEndGameFlow();

  return (
    <Container className={styles.container}>
      <Header className={styles.header} inGame data-relative="true" />
      <EndGameUsersBadgeWithPoints className={styles.playerName} data-relative="true" />
      <Typography className={styles.playerPlace} data-relative="true">
        {myPlace > 0 ? `${myPlace} место` : 'Место не определено'}
      </Typography>
      <div className={styles.endButtons} data-relative="true">
        <Button
          className={styles.endBtn}
          variant="buttonUnderline"
          onClick={() => void handlePlayAgain()}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Переход...' : 'Еще!'}
        </Button>
        <Button className={styles.endBtn} variant="buttonUnderline" onClick={handleExitHome}>
          Выйти
        </Button>
      </div>
      {errorText ? <Typography>{errorText}</Typography> : null}
      <img src={endIcon} alt="" className={styles.endIcon} data-decor="true" />
    </Container>
  );
};
