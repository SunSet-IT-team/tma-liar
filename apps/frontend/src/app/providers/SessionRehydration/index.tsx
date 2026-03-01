import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../routes/pages';
import { getCurrentTmaUser } from '../../../shared/lib/tma/user';
import { findLobbyRequest } from '../../../shared/services/lobby/lobby.api';
import { lobbySessionService } from '../../../shared/services/lobby/lobby-session.service';
import {
  type GameSocketState,
  getLobbySocket,
  subscribeGameRoom,
  subscribeLobbyRoom,
} from '../../../shared/services/socket/lobby.socket';
import type { LobbySession } from '../../../shared/services/lobby/lobby-session.service';

type RouteTarget = {
  path: string;
  state?: unknown;
};

type GamePlayerState = NonNullable<LobbySession['gamePlayers']>[number];

function mergeGamePlayers(
  currentPlayers: LobbySession['gamePlayers'] | undefined,
  incomingPlayers:
    | Array<
        Partial<GamePlayerState> & {
          id?: string;
          _removed?: boolean;
        }
      >
    | undefined,
): LobbySession['gamePlayers'] | undefined {
  if (!Array.isArray(incomingPlayers) || incomingPlayers.length === 0) {
    return currentPlayers;
  }

  const base = [...(currentPlayers ?? [])];
  for (const incoming of incomingPlayers) {
    const id = incoming.id;
    if (!id) continue;

    const index = base.findIndex((item) => item.id === id);
    if (incoming._removed) {
      if (index !== -1) {
        base.splice(index, 1);
      }
      continue;
    }

    const prev = index === -1 ? undefined : base[index];
    const next: GamePlayerState = {
      id,
      nickname: incoming.nickname ?? prev?.nickname ?? `Игрок ${id.slice(-4)}`,
      profileImg: incoming.profileImg ?? prev?.profileImg ?? '',
      isReady: incoming.isReady ?? prev?.isReady ?? false,
      loserTask: incoming.loserTask ?? prev?.loserTask ?? null,
      answer: incoming.answer ?? prev?.answer ?? null,
      likes: incoming.likes ?? prev?.likes ?? 0,
      isConfirmed: incoming.isConfirmed ?? prev?.isConfirmed ?? false,
      score: incoming.score ?? prev?.score ?? 0,
    };

    if (index === -1) {
      base.push(next);
    } else {
      base[index] = next;
    }
  }

  return base;
}

function applyGameStateToSession(session: LobbySession, gameState: GameSocketState): LobbySession {
  return {
    ...session,
    currentGameId: gameState.gameId ?? session.currentGameId,
    currentStage: gameState.stage ?? session.currentStage ?? null,
    currentLiarId: gameState.liarId ?? session.currentLiarId ?? null,
    currentQuestionId: gameState.activeQuestion ?? session.currentQuestionId ?? null,
    currentQuestionText: gameState.activeQuestionText ?? session.currentQuestionText ?? null,
    currentWinnerId: gameState.winnerId ?? session.currentWinnerId ?? null,
    currentLoserId: gameState.loserId ?? session.currentLoserId ?? null,
    currentLoserTask: gameState.loserTask ?? session.currentLoserTask ?? null,
    gamePlayers:
      gameState.players && gameState.players.length > 0
        ? mergeGamePlayers(session.gamePlayers, gameState.players)
        : session.gamePlayers,
  };
}

function resolveWaitingRoute(isAdmin: boolean): RouteTarget {
  return {
    path: `/${isAdmin ? PageRoutes.LOBBY_ADMIN : PageRoutes.LOBBY_PLAYER}`,
  };
}

function resolveGameRoute(params: {
  stage: string | null;
  isAdmin: boolean;
  isLiar: boolean;
}): RouteTarget | null {
  const { stage, isAdmin, isLiar } = params;

  switch (stage) {
    case 'lobby':
      return resolveWaitingRoute(isAdmin);
    case 'liar_chooses':
      if (isLiar) {
        return { path: `/${PageRoutes.CHOOSING_LIAR}` };
      }
      return { path: `/${PageRoutes.WAITING_PLAYERS}` };
    case 'question_to_liar':
      if (isLiar) {
        return { path: `/${PageRoutes.ANSWER_LIAR}` };
      }
      return { path: `/${PageRoutes.ANSWER_SOLVED}` };
    case 'question_results':
      if (isLiar) {
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
        const nextSession = applyGameStateToSession(baseSession, gameState);
        lobbySessionService.set(nextSession);

        const isLiar = Boolean(nextSession.currentLiarId && nextSession.currentLiarId === user.telegramId);
        const target = resolveGameRoute({
          stage: nextSession.currentStage ?? null,
          isAdmin,
          isLiar,
        });
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
      liarId?: string | null;
      diff?: {
        stage?: string;
        activeQuestion?: string | null;
        winnerId?: string | null;
        loserId?: string | null;
        loserTask?: string | null;
        players?: Array<Partial<GamePlayerState> & { id?: string; _removed?: boolean }>;
      };
      status?: string;
      activeQuestion?: string | null;
      activeQuestionText?: string | null;
      winnerId?: string | null;
      loserId?: string | null;
      loserTask?: string | null;
      players?: Array<GamePlayerState>;
    }) => {
      const syncBySocketEvent = async () => {
        const session = lobbySessionService.get();
        if (!session) return;

        const user = getCurrentTmaUser();
        const gameId = payload.gameId ?? session.currentGameId ?? null;
        let stage = payload.stage ?? payload.diff?.stage ?? session.currentStage ?? null;
        let liarId = payload.liarId ?? session.currentLiarId ?? null;
        let activeQuestion = payload.activeQuestion ?? payload.diff?.activeQuestion ?? session.currentQuestionId ?? null;
        let activeQuestionText = payload.activeQuestionText ?? session.currentQuestionText ?? null;
        let winnerId = payload.winnerId ?? payload.diff?.winnerId ?? session.currentWinnerId ?? null;
        let loserId = payload.loserId ?? payload.diff?.loserId ?? session.currentLoserId ?? null;
        let loserTask = payload.loserTask ?? payload.diff?.loserTask ?? session.currentLoserTask ?? null;
        let gamePlayers =
          mergeGamePlayers(session.gamePlayers, payload.players) ??
          mergeGamePlayers(session.gamePlayers, payload.diff?.players) ??
          session.gamePlayers;

        if (gameId) {
          try {
            const gameState = await subscribeGameRoom(gameId);
            stage = gameState.stage ?? stage;
            liarId = gameState.liarId ?? liarId;
            activeQuestion = gameState.activeQuestion ?? activeQuestion;
            activeQuestionText = gameState.activeQuestionText ?? activeQuestionText;
            winnerId = gameState.winnerId ?? winnerId;
            loserId = gameState.loserId ?? loserId;
            loserTask = gameState.loserTask ?? loserTask;
            gamePlayers = mergeGamePlayers(gamePlayers, gameState.players) ?? gamePlayers;
          } catch {
            // ignore: keep last known state
          }
        }

        const nextSession = {
          ...session,
          currentGameId: gameId,
          currentStage: stage ?? null,
          currentLiarId: liarId,
          currentQuestionId: activeQuestion ?? null,
          currentQuestionText: activeQuestionText ?? null,
          currentWinnerId: winnerId ?? null,
          currentLoserId: loserId ?? null,
          currentLoserTask: loserTask ?? null,
          gamePlayers,
          status: gameId ? 'started' : session.status,
        };
        lobbySessionService.set(nextSession);

        if (!stage) return;

        const isAdmin = nextSession.adminId === user.telegramId;
        const isLiar = Boolean(liarId && liarId === user.telegramId);
        const target = resolveGameRoute({ stage, isAdmin, isLiar });
        if (!target) return;

        if (location.pathname !== target.path) {
          navigate(target.path, { replace: true, state: target.state });
        }
      };

      void syncBySocketEvent();
    };

    socket.on(eventName, onGameStatusChanged);
    return () => {
      socket.off(eventName, onGameStatusChanged);
    };
  }, [location.pathname, navigate]);

  return null;
}
