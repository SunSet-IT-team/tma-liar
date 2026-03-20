import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '@app/routes/pages';
import { getCurrentUser, getCurrentUserId } from '@shared/lib/tma/user';
import { findLobbyRequest } from '@shared/services/lobby/lobby.api';
import { lobbySessionService } from '@shared/services/lobby/lobby-session.service';
import { joinLobbyBySocket } from '@shared/services/socket/lobby.socket';

export function useJoinLobby(params?: { initialLobbyCode?: string }) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [lobbyCode, setLobbyCode] = useState(params?.initialLobbyCode ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const joinLobbyWithCode = async (codeRaw: string) => {
    const code = codeRaw.trim();
    if (!code || isSubmitting) return;

    setIsSubmitting(true);
    setErrorText(null);

    try {
      const normalizedCode = code.toUpperCase();
      const lobbyView = await joinLobbyBySocket({
        lobbyCode: normalizedCode,
        nickname: user.nickname,
        profileImg: user.profileImg,
        loserTask: '',
      });

      const lobbyFull = await findLobbyRequest(normalizedCode);

      lobbySessionService.set({
        lobbyCode: lobbyView.lobbyCode,
        adminId: lobbyView.adminId,
        currentGameId: lobbyFull.currentGameId ?? null,
        status: lobbyView.status,
        currentStage: null,
        players: lobbyView.players,
        settings: lobbyFull.settings,
      });

      navigate(
        lobbyView.adminId === getCurrentUserId(user)
          ? `/${PageRoutes.LOBBY_ADMIN}`
          : `/${PageRoutes.LOBBY_PLAYER}`,
      );
    } catch {
      setErrorText('Не удалось подключиться к лобби. Проверьте код и попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const joinLobby = async () => {
    await joinLobbyWithCode(lobbyCode);
  };

  return {
    user,
    lobbyCode,
    isSubmitting,
    errorText,
    setLobbyCode,
    joinLobby,
    joinLobbyWithCode,
  };
}

