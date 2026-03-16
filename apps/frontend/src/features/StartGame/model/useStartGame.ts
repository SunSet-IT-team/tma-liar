import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameSocketEvents } from '@liar/message-types';
import { SocketSystemEvents } from '@liar/message-types';
import type { SocketErrorPayload } from '@liar/message-types';
import { PageRoutes } from '@app/routes/pages';
import { preloadAllScreens } from '@app/routes/preloadScreens';
import { getLobbySocket, subscribeLobbyRoom } from '@shared/services/socket/lobby.socket';
import { emitEvent, offEvent, onEvent } from '@shared/services/socket/typed-socket';

type LobbySnapshot = Awaited<ReturnType<typeof subscribeLobbyRoom>>;

type UseStartGameParams = {
  lobbyCode: string | null | undefined;
  onSyncLobbyState: (state: LobbySnapshot) => void;
};

export function useStartGame({ lobbyCode, onSyncLobbyState }: UseStartGameParams) {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const startGame = () => {
    if (!lobbyCode || isStarting) return;

    // Прогреваем lazy-чанки экранов до переходов в игровой поток.
    void preloadAllScreens();

    setIsStarting(true);
    setStartError(null);

    const socket = getLobbySocket();
    const onError = (error: SocketErrorPayload) => {
      const code = error.errorCode ?? error.message ?? 'GAME_START_ERROR';

      if (code === 'PLAYER_IS_NOT_ADMIN') {
        setStartError('Вы больше не админ этого лобби. Открывается экран игрока.');
        void subscribeLobbyRoom(lobbyCode)
          .then((state) => {
            onSyncLobbyState(state);
            navigate(`/${PageRoutes.LOBBY_PLAYER}`, { replace: true });
          })
          .catch(() => {
            navigate('/', { replace: true });
          });
      } else if (code === 'NOT_ALL_PLAYERS_READY') {
        setStartError('Не удалось начать игру: не все игроки готовы.');
        void subscribeLobbyRoom(lobbyCode)
          .then((state) => {
            onSyncLobbyState(state);
          })
          .catch(() => undefined);
      } else {
        setStartError(`Не удалось начать игру (${code}).`);
      }

      setIsStarting(false);
      offEvent(socket, SocketSystemEvents.ERROR, onError);
    };

    onEvent(socket, SocketSystemEvents.ERROR, onError);
    emitEvent(socket, GameSocketEvents.GAME_STARTED, { lobbyCode });

    window.setTimeout(() => {
      offEvent(socket, SocketSystemEvents.ERROR, onError);
      setIsStarting(false);
    }, 5000);
  };

  return {
    isStarting,
    startError,
    setStartError,
    startGame,
  };
}
