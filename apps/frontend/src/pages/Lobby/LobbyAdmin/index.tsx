import { type FC } from 'react';
import styles from '../style/waitingLobbyStyle.module.scss';
import { Header } from '../../../widgets/Header';
import { Typography } from '../../../shared/ui/Typography';
import { LobbyUsersBadge } from '../../../features/UsersBadge/ui/LobbyUsersBadge';
import { TextInput } from '../../../shared/ui/TextInput';
import { Container } from '../../../shared/ui/Container';
import { Button } from '../../../shared/ui/Button';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../../app/routes/pages';

/**
 * Экран ожидания игроков в лобби (админ)
 */
export const LobbyAdmin: FC = () => {
  const navigate = useNavigate();

  return (
    <Container className={styles.container}>
      <Header className={styles.header} />
      <div className={styles.lobbyBlock}>
        <Typography variant="titleLarge" as="h1" className={styles.lobbyTitle}>
          Лобби
          <Typography className={styles.lobbyCode}>#13HJ</Typography>
        </Typography>
      </div>
      <LobbyUsersBadge playersClassName={styles.lobbyPlayers} className={styles.players} />
      <div className={styles.taskBlock}>
        <Typography className={styles.taskLoserText}>Задание проигравшему</Typography>
        <TextInput
          placeholder="Task"
          className={styles.taskLoserWrapper}
          inputClassName={styles.taskLoserInput}
        />
        <Typography className={styles.connectedPlayers}>1/7</Typography>
      </div>
      <Button className={styles.readyBtn} onClick={() => navigate(`/${PageRoutes.CHOOSING_LIAR}`)}>
        Начать
      </Button>
    </Container>
  );
};
