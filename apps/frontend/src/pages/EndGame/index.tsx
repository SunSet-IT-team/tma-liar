import { type FC } from 'react';
import { LobbyUsersBadge } from '../../features/UsersBadge/ui/LobbyUsersBadge';
import { Button } from '../../shared/ui/Button';
import { Container } from '../../shared/ui/Container';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/endGameStyle.module.scss';
import endIcon from '/icons/endIcon2.svg';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../app/routes/pages';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';
import { getCurrentTmaUser } from '../../shared/lib/tma/user';

/**
 * Экран, конец игры
 */
export const EndGame: FC = () => {
  const navigate = useNavigate();
  const session = lobbySessionService.get();
  const me = getCurrentTmaUser();
  const sortedPlayers = [...(session?.gamePlayers ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const myPlace = sortedPlayers.findIndex((player) => player.id === me.telegramId) + 1;

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
          onClick={() => navigate(`/${PageRoutes.CREATE_LOBBY}`)}
        >
          Еще!
        </Button>
        <Button className={styles.endBtn} variant="buttonUnderline" onClick={() => navigate('/')}>
          Выйти
        </Button>
      </div>
      <img src={endIcon} alt="" className={styles.endIcon} />
    </Container>
  );
};
