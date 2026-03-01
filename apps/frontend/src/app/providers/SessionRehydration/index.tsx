import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../routes/pages';
import { getCurrentTmaUser } from '../../../shared/lib/tma/user';
import { findLobbyRequest } from '../../../shared/services/lobby/lobby.api';
import { lobbySessionService } from '../../../shared/services/lobby/lobby-session.service';
import {
  getLobbySocket,
  subscribeGameRoom,
  subscribeLobbyRoom,
} from '../../../shared/services/socket/lobby.socket';

type RouteTarget = {
  path: string;
  state?: unknown;
};

function resolveWaitingRoute(isAdmin: boolean): RouteTarget {
  return {
    path: `/${isAdmin ? PageRoutes.LOBBY_ADMIN : PageRoutes.LOBBY_PLAYER}`,
  };
}

function resolveGameRoute(isAdmin: boolean, stage: string | null): RouteTarget | null {
  switch (stage) {
    case 'lobby':
      return resolveWaitingRoute(isAdmin);
    case 'liar_chooses':
      if (isAdmin) {
        return { path: `/${PageRoutes.CHOOSING_LIAR}` };
      }
      return {
        path: `/${PageRoutes.WAITING_PLAYERS}`,
        state: { nextRoute: `/${PageRoutes.ANSWER_SOLVED}` },
      };
    case 'question_to_liar':
      if (isAdmin) {
        return { path: `/${PageRoutes.ANSWER_LIAR}` };
      }
      return { path: `/${PageRoutes.ANSWER_SOLVED}` };
    case 'question_results':
      if (isAdmin) {
        return { path: `/${PageRoutes.ANSWERS_PLAYERS}` };
      }
      return { path: `/${PageRoutes.RATE_PLAYERS}` };
    case 'game_results':
      return { path: `/${PageRoutes.RESULT_GAME}` };
    case 'end':
      return { path: `/${PageRoutes.END_GAME}` };
    default:
      return null;
  }
}

export function SessionRehydration() {
  const navigate = useNavigate();
  const location = useLocation();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const session = lobbySessionService.get();
    if (!session?.lobbyCode) return;

    const run = async () => {
      try {
        const user = getCurrentTmaUser();
        const lobbyState = await subscribeLobbyRoom(session.lobbyCode);
        const lobbyFull = await findLobbyRequest(session.lobbyCode);

        const baseSession = {
          ...session,
          lobbyCode: lobbyState.lobbyCode,
          adminId: lobbyState.adminId,
          currentGameId: lobbyFull.currentGameId ?? lobbyState.currentGameId ?? null,
          status: lobbyState.status,
          players: lobbyState.players,
          settings: lobbyFull.settings,
          currentStage: session.currentStage ?? null,
        };

        const meInLobby = baseSession.players.some((player) => player.id === user.telegramId);
        if (!meInLobby) {
          throw new Error('USER_NOT_IN_LOBBY');
        }

        const isAdmin = baseSession.adminId === user.telegramId;

        if (baseSession.status !== 'started' || !baseSession.currentGameId) {
          lobbySessionService.set(baseSession);
          const target = resolveWaitingRoute(isAdmin);
          if (location.pathname !== target.path) {
            navigate(target.path, { replace: true });
          }
          return;
        }

        const gameState = await subscribeGameRoom(baseSession.currentGameId);
        const nextSession = {
          ...baseSession,
          currentStage: gameState.stage ?? baseSession.currentStage ?? null,
        };
        lobbySessionService.set(nextSession);

        const target = resolveGameRoute(isAdmin, nextSession.currentStage ?? null);
        if (!target) return;

        if (location.pathname !== target.path) {
          navigate(target.path, { replace: true, state: target.state });
        }
      } catch {
        lobbySessionService.clear();
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      }
    };

    void run();
  }, [location.pathname, navigate]);

  useEffect(() => {
    const socket = getLobbySocket();
    const eventName = 'changeGameStatus';

    const onGameStatusChanged = (payload: {
      gameId?: string;
      stage?: string;
      diff?: { stage?: string };
      status?: string;
    }) => {
      const session = lobbySessionService.get();
      if (!session) return;

      const stage = payload.stage ?? payload.diff?.stage ?? null;
      const gameId = payload.gameId ?? session.currentGameId ?? null;

      if (!stage && !gameId) return;

      const nextSession = {
        ...session,
        currentGameId: gameId,
        currentStage: stage ?? session.currentStage ?? null,
        status: gameId ? 'started' : session.status,
      };
      lobbySessionService.set(nextSession);

      if (gameId) {
        void subscribeGameRoom(gameId).catch(() => undefined);
      }

      if (!stage) return;
      const user = getCurrentTmaUser();
      const isAdmin = nextSession.adminId === user.telegramId;
      const target = resolveGameRoute(isAdmin, stage);
      if (!target) return;

      if (location.pathname !== target.path) {
        navigate(target.path, { replace: true, state: target.state });
      }
    };

    socket.on(eventName, onGameStatusChanged);
    return () => {
      socket.off(eventName, onGameStatusChanged);
    };
  }, [location.pathname, navigate]);

  return null;
}
