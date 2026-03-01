import { type FC } from 'react';
import styles from './style/connectLobbyStyle.module.scss';
import { Container } from '../../shared/ui/Container';
import { Header } from '../../widgets/Header';
import { Typography } from '../../shared/ui/Typography';
import { TextInput } from '../../shared/ui/TextInput';
import { Button } from '../../shared/ui/Button';
import { UserBadge } from '../../entities/user/ui/UserBadge';
import circleIcon from '/icons/profileCircle.svg';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../app/routes/pages';
import { useJoinLobby } from '@features/JoinLobby';

/**
 * Экран присоединения к лобби
 */
export const ConnectLobby: FC = () => {
  const navigate = useNavigate();
  const { user, lobbyCode, isSubmitting, errorText, setLobbyCode, joinLobby } = useJoinLobby();

  return (
    <Container>
      <Header />
      <Typography as="h1" variant="titleLarge" className={styles.title}>
        <Typography as="span" variant="titleLarge">
          Код
        </Typography>
        Лобби
      </Typography>
      <TextInput
        placeholder="Введите код лобби"
        className={styles.lobbyInput}
        value={lobbyCode}
        onChange={(event) => setLobbyCode(event.target.value)}
      />
      <Button className={styles.connectBtn} onClick={joinLobby} disabled={isSubmitting}>
        {isSubmitting ? 'Подключаю...' : 'Присоединиться'}
      </Button>

      {errorText && <Typography>{errorText}</Typography>}

      <button onClick={() => navigate(`/${PageRoutes.PROFILE}`)}>
        <UserBadge variant="large" id={1} name={user.nickname} photo={user.profileImg} />
      </button>
      <img src={circleIcon} alt="" className={styles.circleIcon} />
    </Container>
  );
};
