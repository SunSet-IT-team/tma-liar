import { type FC, useState } from 'react';
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
import { updateLobbyRequest } from '../../shared/services/lobby/lobby.api';
import { disconnectLobbySocket } from '../../shared/services/socket/lobby.socket';

/**
 * Экран, конец игры
 */
export const EndGame: FC = () => {
  const navigate = useNavigate();
  const session = lobbySessionService.get();
  const me = getCurrentTmaUser();
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sortedPlayers = [...(session?.gamePlayers ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const myPlace = sortedPlayers.findIndex((player) => player.id === me.telegramId) + 1;

  const handlePlayAgain = async () => {
    if (!session?.lobbyCode || isSubmitting) return;

    setErrorText(null);
    setIsSubmitting(true);

    try {
      const lobby = await updateLobbyRequest({
        lobbyCode: session.lobbyCode,
        status: 'waiting',
        currentGameId: null,
      });

      const nextSession = {
        ...session,
        adminId: lobby.adminId,
        currentGameId: null,
        status: 'waiting',
        currentStage: 'lobby',
        currentStageStartedAt: null,
        currentStageDurationMs: null,
        currentLiarId: null,
        currentQuestionId: null,
        currentQuestionText: null,
        currentWinnerId: null,
        currentLoserId: null,
        currentLoserTask: null,
        gamePlayers: undefined,
        players: lobby.players.map((player) => ({
          id: player.telegramId,
          nickname: player.nickname,
          profileImg: player.profileImg ?? '',
          isReady: player.isReady,
          inGame: player.inGame ?? false,
          loserTask: player.loserTask ?? null,
        })),
      };
      lobbySessionService.set(nextSession);

      // Отключаемся от старых комнат сокета, чтобы не прилетали stage-события прошлой игры.
      disconnectLobbySocket();

      const target = lobby.adminId === me.telegramId ? PageRoutes.LOBBY_ADMIN : PageRoutes.LOBBY_PLAYER;
      navigate(`/${target}`, { replace: true });
    } catch {
      setErrorText('Не удалось вернуться в лобби. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Button className={styles.endBtn} variant="buttonUnderline" onClick={() => navigate('/')}>
          Выйти
        </Button>
      </div>
      {errorText ? <Typography>{errorText}</Typography> : null}
      <img src={endIcon} alt="" className={styles.endIcon} />
    </Container>
  );
};
