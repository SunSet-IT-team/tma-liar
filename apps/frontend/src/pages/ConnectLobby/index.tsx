import { useState, type FC } from 'react';
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
import { getCurrentTmaUser } from '../../shared/lib/tma/user';
import { joinLobbyBySocket } from '../../shared/services/socket/lobby.socket';
import { findLobbyRequest } from '../../shared/services/lobby/lobby.api';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';

/**
 * Экран присоединения к лобби
 */
export const ConnectLobby: FC = () => {
  const navigate = useNavigate();
  const [lobbyCode, setLobbyCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const user = getCurrentTmaUser();

  const joinLobby = async () => {
    if (!lobbyCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorText(null);

    try {
      const normalizedCode = lobbyCode.trim().toUpperCase();
      const lobbyView = await joinLobbyBySocket({
        lobbyCode: normalizedCode,
        nickname: user.nickname,
        profileImg: user.profileImg,
        loserTask: 'task',
      });

      const lobbyFull = await findLobbyRequest(normalizedCode);

      lobbySessionService.set({
        lobbyCode: lobbyView.lobbyCode,
        adminId: lobbyView.adminId,
        status: lobbyView.status,
        players: lobbyView.players,
        settings: lobbyFull.settings,
      });

      if (lobbyView.adminId === user.telegramId) {
        navigate(`/${PageRoutes.LOBBY_ADMIN}`);
      } else {
        navigate(`/${PageRoutes.LOBBY_PLAYER}`);
      }
    } catch {
      setErrorText('Не удалось подключиться к лобби. Проверьте код и попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
