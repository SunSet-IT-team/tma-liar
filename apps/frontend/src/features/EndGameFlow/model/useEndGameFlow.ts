import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '@app/routes/pages';
import { getCurrentUser, getCurrentUserId } from '@shared/lib/tma/user';
import { updateLobbyRequest } from '@shared/services/lobby/lobby.api';
import { lobbySessionService } from '@shared/services/lobby/lobby-session.service';
import { disconnectLobbySocket } from '@shared/services/socket/lobby.socket';

export function useEndGameFlow() {
  const navigate = useNavigate();
  const session = lobbySessionService.get();
  const me = getCurrentUser();
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedPlayers = useMemo(
    () => [...(session?.gamePlayers ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [session?.gamePlayers],
  );
  const myPlace = sortedPlayers.findIndex((player) => player.id === getCurrentUserId(me)) + 1;

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
        status: 'waiting' as const,
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
          id: player.id ?? player.telegramId,
          nickname: player.nickname,
          profileImg: player.profileImg ?? '',
          isReady: player.isReady,
          inGame: player.inGame ?? false,
          loserTask: player.loserTask ?? null,
        })),
      };
      lobbySessionService.set(nextSession);

      // Пересоздаем соединение для чистого перехода в новое лобби-состояние.
      disconnectLobbySocket();

      const target = lobby.adminId === getCurrentUserId(me) ? PageRoutes.LOBBY_ADMIN : PageRoutes.LOBBY_PLAYER;
      navigate(`/${target}`, { replace: true });
    } catch {
      setErrorText('Не удалось вернуться в лобби. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitHome = () => {
    navigate('/');
  };

  return {
    myPlace,
    errorText,
    isSubmitting,
    handlePlayAgain,
    handleExitHome,
  };
}

