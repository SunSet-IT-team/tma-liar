import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../routes/pages';
import { store } from '../../store';
import { resetTimer, startTimer } from '../../../entities/game/model/timerSlice';
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
      inGame: incoming.inGame ?? prev?.inGame ?? false,
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
    currentStageStartedAt: gameState.stageStartedAt ?? session.currentStageStartedAt ?? null,
    currentStageDurationMs: gameState.stageDurationMs ?? session.currentStageDurationMs ?? null,
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

function resolveStageDuration(stage: string | null | undefined, session: LobbySession): number | null {
  if (!stage) return null;
  if (stage === 'liar_chooses') return 10;
  if (stage === 'question_to_liar') return session.settings?.answerTime ?? 20;
  if (stage === 'question_results') return 10;
  if (stage === 'game_results') return 10;
  return null;
}

function resolveRemainingSeconds(params: {
  stageDurationMs?: number | null;
  stageStartedAt?: number | null;
  fallbackSeconds?: number | null;
}): number | null {
  const { stageDurationMs, stageStartedAt, fallbackSeconds } = params;
  if (typeof stageDurationMs === 'number' && typeof stageStartedAt === 'number') {
    const remainingMs = stageDurationMs - (Date.now() - stageStartedAt);
    const remainingSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
    return remainingSeconds;
  }
  return fallbackSeconds ?? null;
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
  isParticipant: boolean;
}): RouteTarget | null {
  const { stage, isAdmin, isLiar, isParticipant } = params;

  if (!isParticipant) {
    return resolveWaitingRoute(isAdmin);
  }

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
  const stageTimerRef = useRef<string | null>(null);

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
          stageTimerRef.current = null;
          store.dispatch(resetTimer());
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
        const initialStage = nextSession.currentStage ?? null;
        const initialDurationFallback = resolveStageDuration(initialStage, nextSession);
        const initialRemainingSeconds = resolveRemainingSeconds({
          stageDurationMs: nextSession.currentStageDurationMs,
          stageStartedAt: nextSession.currentStageStartedAt,
          fallbackSeconds: initialDurationFallback,
        });
        const initialStageKey = `${initialStage ?? 'none'}:${nextSession.currentStageStartedAt ?? 'none'}`;
        if (initialRemainingSeconds !== null && stageTimerRef.current !== initialStageKey) {
          store.dispatch(startTimer(initialRemainingSeconds));
          stageTimerRef.current = initialStageKey;
        }

        const isLiar = Boolean(nextSession.currentLiarId && nextSession.currentLiarId === user.telegramId);
        const target = resolveGameRoute({
          stage: nextSession.currentStage ?? null,
          isAdmin,
          isLiar,
          isParticipant: Boolean(nextSession.gamePlayers?.some((player) => player.id === user.telegramId)),
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
      stageStartedAt?: number;
      stageDurationMs?: number | null;
      liarId?: string | null;
      diff?: {
        stage?: string;
        status?: string;
        currentGameId?: string | null;
        adminId?: string;
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

        const incomingStage = payload.stage ?? payload.diff?.stage ?? null;
        const incomingGameId = payload.gameId ?? null;
        const isLateResultFromPreviousGame =
          session.status === 'waiting' &&
          !session.currentGameId &&
          (incomingStage === 'game_results' || incomingStage === 'end');

        if (isLateResultFromPreviousGame) {
          return;
        }

        if (incomingGameId && session.currentGameId && incomingGameId !== session.currentGameId) {
          return;
        }

        const user = getCurrentTmaUser();
        const hasDiffCurrentGameId = Boolean(
          payload.diff && Object.prototype.hasOwnProperty.call(payload.diff, 'currentGameId'),
        );
        const gameId = payload.gameId ?? (hasDiffCurrentGameId ? payload.diff?.currentGameId ?? null : session.currentGameId ?? null);
        const rawStatus = payload.diff?.status ?? payload.status ?? null;
        const lobbyStatusFromPayload =
          rawStatus === 'waiting' || rawStatus === 'started' || rawStatus === 'finished' ? rawStatus : null;

        // When game event arrives before lobby diff (common at game start),
        // verify it against the current lobby state. This prevents stale
        // game events from resurrecting an old session while still allowing
        // players to enter a freshly started game.
        if (payload.gameId && !session.currentGameId && !hasDiffCurrentGameId) {
          const incomingStage = payload.stage ?? payload.diff?.stage ?? null;
          if (incomingStage === 'game_results' || incomingStage === 'end') {
            return;
          }

          try {
            const lobbySnapshot = await findLobbyRequest(session.lobbyCode);
            const isSameGame = lobbySnapshot.currentGameId === payload.gameId;
            const isStarted = lobbySnapshot.status === 'started';
            if (!isSameGame || !isStarted) {
              return;
            }
          } catch {
            // On transient fetch errors don't block event processing.
          }
        }

        const nextStatus = lobbyStatusFromPayload ?? (gameId ? 'started' : session.status);
        let stage = payload.stage ?? payload.diff?.stage ?? session.currentStage ?? null;
        let stageStartedAt = payload.stageStartedAt ?? session.currentStageStartedAt ?? null;
        let stageDurationMs = payload.stageDurationMs ?? session.currentStageDurationMs ?? null;
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

        if (!stage && gameId) {
          try {
            const gameState = await subscribeGameRoom(gameId);
            stage = gameState.stage ?? stage;
            stageStartedAt = gameState.stageStartedAt ?? stageStartedAt;
            stageDurationMs = gameState.stageDurationMs ?? stageDurationMs;
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

        const shouldResetGameState = nextStatus !== 'started' || !gameId;

        const nextSession = {
          ...session,
          adminId: payload.diff?.adminId ?? session.adminId,
          currentGameId: gameId,
          currentStage: shouldResetGameState ? 'lobby' : stage ?? null,
          currentStageStartedAt: shouldResetGameState ? null : stageStartedAt ?? null,
          currentStageDurationMs: shouldResetGameState ? null : stageDurationMs ?? null,
          currentLiarId: shouldResetGameState ? null : liarId,
          currentQuestionId: shouldResetGameState ? null : activeQuestion ?? null,
          currentQuestionText: shouldResetGameState ? null : activeQuestionText ?? null,
          currentWinnerId: shouldResetGameState ? null : winnerId ?? null,
          currentLoserId: shouldResetGameState ? null : loserId ?? null,
          currentLoserTask: shouldResetGameState ? null : loserTask ?? null,
          gamePlayers: shouldResetGameState ? undefined : gamePlayers,
          status: nextStatus,
        };
        lobbySessionService.set(nextSession);
        const stageDurationFallback = resolveStageDuration(nextSession.currentStage, nextSession);
        const remainingSeconds = resolveRemainingSeconds({
          stageDurationMs: nextSession.currentStageDurationMs,
          stageStartedAt: nextSession.currentStageStartedAt,
          fallbackSeconds: stageDurationFallback,
        });
        const stageKey = `${nextSession.currentStage ?? 'none'}:${nextSession.currentStageStartedAt ?? 'none'}`;
        if (remainingSeconds !== null && stageTimerRef.current !== stageKey) {
          store.dispatch(startTimer(remainingSeconds));
          stageTimerRef.current = stageKey;
        }
        if (remainingSeconds === null) {
          stageTimerRef.current = null;
          store.dispatch(resetTimer());
        }

        const routeStage = shouldResetGameState ? 'lobby' : stage;
        if (!routeStage) return;

        const isAdmin = nextSession.adminId === user.telegramId;
        const isLiar = Boolean(liarId && liarId === user.telegramId);
        const resolvedTarget = resolveGameRoute({
          stage: routeStage,
          isAdmin,
          isLiar,
          isParticipant: Boolean(nextSession.gamePlayers?.some((player) => player.id === user.telegramId)),
        });
        if (!resolvedTarget) return;

        if (location.pathname !== resolvedTarget.path) {
          navigate(resolvedTarget.path, { replace: true, state: resolvedTarget.state });
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
