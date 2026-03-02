import { type FC } from 'react';
import { LobbyUsersBadge } from '../../features/UsersBadge/ui/LobbyUsersBadge';
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
      <Header className={styles.header} inGame />
      <LobbyUsersBadge className={styles.playerName} />
      <Typography className={styles.playerPlace}>
        {myPlace > 0 ? `${myPlace} место` : 'Место не определено'}
      </Typography>
      <div className={styles.endButtons}>
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
