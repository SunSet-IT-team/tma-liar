import { type FC } from 'react';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/waitingPlayersStyle.module.scss';
import waitingIcon from '/icons/waitingIcon.svg';
import waitingCircle from '/icons/waitingCircle.svg';
import { Container } from '../../shared/ui/Container';

/**
 * Экран показывается решало, когда лжец делает выбор
 */
export const WaitingPlayers: FC = () => {
  return (
    <Container className={styles.container}>
      <Header className={styles.header} inGame popupStyle="white" />
      <Typography className={styles.title} variant="titleLarge">
        Ждем!
      </Typography>
      <Typography>Других игроков</Typography>
      <img src={waitingIcon} alt="" className={styles.waitingIcon} data-decor="true" />
      <img src={waitingCircle} alt="" className={styles.waitingCircle} data-decor="true" />
      <Typography className={styles.waitingText}>Уже скоро?</Typography>
    </Container>
  );
};
