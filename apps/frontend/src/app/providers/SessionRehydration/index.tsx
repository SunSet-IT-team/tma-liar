import { useEffect, useRef } from 'react';
import { isGameStatusChangedPayload } from '@liar/message-types';
import { isLobbyStatusChangedPayload } from '@liar/message-types';
import type { StatusChangedPayload } from '@liar/message-types';
import { SocketSystemEvents } from '@liar/message-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../routes/pages';
import { preloadAllScreens } from '../../routes/preloadScreens';
import { store } from '../../store';
import { resetTimer, startTimer } from '../../../entities/game/model/timerSlice';
import { getCurrentUser, getCurrentUserId } from '../../../shared/lib/tma/user';
import { findLobbyRequest } from '../../../shared/services/lobby/lobby.api';
import { lobbySessionService } from '../../../shared/services/lobby/lobby-session.service';
import {
  type GameSocketState,
  getLobbySocket,
  subscribeGameRoom,
  subscribeLobbyRoom,
} from '../../../shared/services/socket/lobby.socket';
import type { LobbySession } from '../../../shared/services/lobby/lobby-session.service';
import { offEvent, onEvent } from '../../../shared/services/socket/typed-socket';

type RouteTarget = {
  // Маршрут, на который нужно перевести пользователя после анализа состояния.
  path: string;
  // Необязательное состояние роутера (например, служебные флаги/данные экрана).
  state?: unknown;
};

// Снимок одного игрока внутри игрового состояния, которое хранится в сессии лобби.
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
  // Если дифф от сервера пустой, текущее состояние игроков оставляем как есть.
  if (!Array.isArray(incomingPlayers) || incomingPlayers.length === 0) {
    return currentPlayers;
  }

  // Работаем с копией, чтобы не мутировать объект, который уже лежит в хранилище сессии.
  const base = [...(currentPlayers ?? [])];
  for (const incoming of incomingPlayers) {
    const id = incoming.id;
    if (!id) continue;

    const index = base.findIndex((item) => item.id === id);
    // `_removed` приходит как удаление игрока из активного набора (выход/дисконнект и т.д.).
    if (incoming._removed) {
      if (index !== -1) {
        base.splice(index, 1);
      }
      continue;
    }

    // Собираем итоговый объект игрока с безопасными значениями по умолчанию.
    // Это защищает UI от `undefined` и делает обновления частичными (только изменившиеся поля).
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
  // Нормализуем входящее состояние игры и маппим его в локальную структуру сессии.
  // Берем данные из `gameState`, а если конкретного поля нет — сохраняем текущее.
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

function resolveStageDuration(
  stage: string | null | undefined,
  session: LobbySession,
): number | null {
  // Фолбэк-длительность стадии (в секундах), если сервер не прислал тайминг.
  // Важно для плавного восстановления после перезагрузки/переподключения.
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
  // При наличии серверного тайминга считаем остаток точно от серверной временной точки.
  if (typeof stageDurationMs === 'number' && typeof stageStartedAt === 'number') {
    const remainingMs = stageDurationMs - (Date.now() - stageStartedAt);
    const remainingSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
    return remainingSeconds;
  }
  // Если серверный тайминг пока неизвестен, отдаем безопасный фолбэк.
  return fallbackSeconds ?? null;
}

function resolveWaitingRoute(isAdmin: boolean): RouteTarget {
  // Один источник истины для "ожидающих" экранов:
  // админ остается в админском лобби, игрок — в обычном лобби.
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

  // Наблюдатели/новые пользователи, которые не входят в текущий состав игры,
  // всегда остаются на экране лобби и ждут завершения партии.
  if (!isParticipant) {
    return resolveWaitingRoute(isAdmin);
  }

  // Явная матрица "стадия -> экран" для детерминированной навигации.
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
  // Защита: восстанавливаем сессию только один раз при старте приложения.
  const hydratedRef = useRef(false);
  // Не даем повторно перезапускать таймер для одного и того же снимка стадии.
  const stageTimerRef = useRef<string | null>(null);
  // Первый pathname обрабатывает одноразовая гидрация; дальше — только навигация.
  const routeTimerSyncSkipRef = useRef(true);

  /**
   * На игровых экранах секундный тик идёт через GameProcess. На других маршрутах (например, настройки)
   * тик останавливается — Redux «замирает». При возврате пересчитываем остаток от stageStartedAt/stageDurationMs.
   * Не трогаем первый монт: старт таймера уже задаёт эффект гидрации / сокет.
   */
  useEffect(() => {
    if (routeTimerSyncSkipRef.current) {
      routeTimerSyncSkipRef.current = false;
      return;
    }

    const session = lobbySessionService.get();
    if (!session?.lobbyCode || session.status !== 'started' || !session.currentGameId) {
      return;
    }

    const stage = session.currentStage ?? null;
    const fallbackSeconds = resolveStageDuration(stage, session);
    const remainingSeconds = resolveRemainingSeconds({
      stageDurationMs: session.currentStageDurationMs,
      stageStartedAt: session.currentStageStartedAt,
      fallbackSeconds,
    });

    if (remainingSeconds !== null) {
      store.dispatch(startTimer(remainingSeconds));
    }
  }, [location.pathname]);

  useEffect(() => {
    // Гарантируем одноразовое восстановление при старте приложения.
    // Повторный вызов привел бы к лишним сетевым запросам и гонкам навигации.
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const session = lobbySessionService.get();
    // Если локально нет сессии или кода лобби — восстанавливать нечего.
    if (!session?.lobbyCode) return;

    const run = async () => {
      try {
        // Rehydration: восстанавливаем состояние приложения из сохраненной локальной сессии
        // и актуального состояния на бэкенде.
        // "Hydration" обычно про SSR -> привязку клиентского React к готовой разметке.
        // Здесь "Rehydration": восстановление ранее сохраненного состояния рантайма/сессии.
        const user = getCurrentUser();
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

        // Если пользователь больше не числится в лобби (например, его удалили),
        // локальную сессию считаем невалидной.
        const meInLobby = baseSession.players.some(
          (player) => player.id === getCurrentUserId(user),
        );
        if (!meInLobby) {
          throw new Error('USER_NOT_IN_LOBBY');
        }

        const isAdmin = baseSession.adminId === getCurrentUserId(user);

        // Нет активной игры: оставляем пользователя на экране лобби и очищаем игровой таймер/состояние.
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

        // Игра активна: восстанавливаем поля текущей стадии и переводим на нужный экран.
        void preloadAllScreens();
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
        // Таймер перезапускаем только при смене "снимка" стадии,
        // чтобы исключить дрожание UI от дублей событий.
        if (initialRemainingSeconds !== null && stageTimerRef.current !== initialStageKey) {
          store.dispatch(startTimer(initialRemainingSeconds));
          stageTimerRef.current = initialStageKey;
        }

        const isLiar = Boolean(
          nextSession.currentLiarId && nextSession.currentLiarId === getCurrentUserId(user),
        );
        const target = resolveGameRoute({
          stage: nextSession.currentStage ?? null,
          isAdmin,
          isLiar,
          isParticipant: Boolean(
            nextSession.gamePlayers?.some((player) => player.id === getCurrentUserId(user)),
          ),
        });
        if (!target) return;

        if (location.pathname !== target.path) {
          navigate(target.path, { replace: true, state: target.state });
        }
      } catch (error) {
        // Устаревшая сессия / удалённое лобби или игра: не показываем экран 404, возвращаем на главную.
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
    const eventName = SocketSystemEvents.STATUS_CHANGED;

    const onGameStatusChanged = (payload: StatusChangedPayload) => {
      const isGamePayload = isGameStatusChangedPayload(payload);
      const isLobbyPayload = isLobbyStatusChangedPayload(payload);
      if (!isGamePayload && !isLobbyPayload) {
        return;
      }
      const gamePayload = isGamePayload ? payload : null;

      const syncBySocketEvent = async () => {
        const session = lobbySessionService.get();
        if (!session) return;

        const incomingStage = gamePayload?.stage ?? payload.diff?.stage ?? null;
        const incomingGameId = gamePayload?.gameId ?? null;
        // Игнорируем запоздалые события от уже завершенной/удаленной игры.
        const isLateResultFromPreviousGame =
          session.status === 'waiting' &&
          !session.currentGameId &&
          (incomingStage === 'game_results' || incomingStage === 'end');

        if (isLateResultFromPreviousGame) {
          return;
        }

        // Если прилетело событие от другой игры (другой gameId), игнорируем его как устаревшее.
        if (incomingGameId && session.currentGameId && incomingGameId !== session.currentGameId) {
          return;
        }

        const user = getCurrentUser();
        const hasDiffCurrentGameId = Boolean(
          payload.diff && Object.prototype.hasOwnProperty.call(payload.diff, 'currentGameId'),
        );
        const gameId =
          gamePayload?.gameId ??
          (hasDiffCurrentGameId
            ? (payload.diff?.currentGameId ?? null)
            : (session.currentGameId ?? null));
        const rawStatus = payload.diff?.status ?? payload.status ?? null;
        const lobbyStatusFromPayload =
          rawStatus === 'waiting' || rawStatus === 'started' || rawStatus === 'finished'
            ? rawStatus
            : null;

        // Частый кейс: игровое событие приходит раньше обновления лобби (особенно на старте).
        // В этом случае дополнительно сверяемся с актуальным снимком лобби:
        // только если `currentGameId` совпадает и статус действительно `started`,
        // разрешаем обработку события. Это не дает "воскресить" старую игру.
        if (gamePayload?.gameId && !session.currentGameId && !hasDiffCurrentGameId) {
          const incomingStage = gamePayload.stage ?? payload.diff?.stage ?? null;
          if (incomingStage === 'game_results' || incomingStage === 'end') {
            return;
          }

          try {
            const lobbySnapshot = await findLobbyRequest(session.lobbyCode);
            const isSameGame = lobbySnapshot.currentGameId === gamePayload.gameId;
            const isStarted = lobbySnapshot.status === 'started';
            if (!isSameGame || !isStarted) {
              return;
            }
          } catch {
            // Временная ошибка запроса не должна ломать синхронизацию:
            // в таком случае продолжаем по данным события.
          }
        }

        const nextStatus = lobbyStatusFromPayload ?? (gameId ? 'started' : session.status);
        let stage = gamePayload?.stage ?? payload.diff?.stage ?? session.currentStage ?? null;
        let stageStartedAt = gamePayload?.stageStartedAt ?? session.currentStageStartedAt ?? null;
        let stageDurationMs =
          gamePayload?.stageDurationMs ?? session.currentStageDurationMs ?? null;
        let liarId = gamePayload?.liarId ?? session.currentLiarId ?? null;
        let activeQuestion =
          gamePayload?.activeQuestion ??
          gamePayload?.diff?.activeQuestion ??
          session.currentQuestionId ??
          null;
        let activeQuestionText =
          gamePayload?.activeQuestionText ?? session.currentQuestionText ?? null;
        let winnerId =
          gamePayload?.winnerId ?? gamePayload?.diff?.winnerId ?? session.currentWinnerId ?? null;
        let loserId =
          gamePayload?.loserId ?? gamePayload?.diff?.loserId ?? session.currentLoserId ?? null;
        let loserTask =
          gamePayload?.loserTask ??
          gamePayload?.diff?.loserTask ??
          session.currentLoserTask ??
          null;
        let gamePlayers =
          mergeGamePlayers(session.gamePlayers, gamePayload?.players) ??
          mergeGamePlayers(session.gamePlayers, payload.diff?.players) ??
          session.gamePlayers;

        if (!stage && gameId) {
          // Если стадия в событии не пришла, дотягиваем полное состояние по gameId.
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
            // Если догрузить state не удалось, оставляем последнее известное состояние.
          }
        }

        // Статус лобби waiting означает, что клиент должен сбросить все игровое состояние.
        const shouldResetGameState = nextStatus !== 'started' || !gameId;

        const nextSession = {
          ...session,
          adminId: payload.diff?.adminId ?? session.adminId,
          currentGameId: gameId,
          currentStage: shouldResetGameState ? 'lobby' : (stage ?? null),
          currentStageStartedAt: shouldResetGameState ? null : (stageStartedAt ?? null),
          currentStageDurationMs: shouldResetGameState ? null : (stageDurationMs ?? null),
          currentLiarId: shouldResetGameState ? null : liarId,
          currentQuestionId: shouldResetGameState ? null : (activeQuestion ?? null),
          currentQuestionText: shouldResetGameState ? null : (activeQuestionText ?? null),
          currentWinnerId: shouldResetGameState ? null : (winnerId ?? null),
          currentLoserId: shouldResetGameState ? null : (loserId ?? null),
          currentLoserTask: shouldResetGameState ? null : (loserTask ?? null),
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
        // Аналогично первому восстановлению: избегаем лишних перезапусков таймера
        // на одинаковых событиях одной и той же стадии.
        if (remainingSeconds !== null && stageTimerRef.current !== stageKey) {
          store.dispatch(startTimer(remainingSeconds));
          stageTimerRef.current = stageKey;
        }
        if (remainingSeconds === null) {
          // Для стадий без таймера гарантированно гасим таймер в сторе.
          stageTimerRef.current = null;
          store.dispatch(resetTimer());
        }

        const routeStage = shouldResetGameState ? 'lobby' : stage;
        if (!routeStage) return;

        const isAdmin = nextSession.adminId === getCurrentUserId(user);
        const isLiar = Boolean(liarId && liarId === getCurrentUserId(user));
        const resolvedTarget = resolveGameRoute({
          stage: routeStage,
          isAdmin,
          isLiar,
          isParticipant: Boolean(
            nextSession.gamePlayers?.some((player) => player.id === getCurrentUserId(user)),
          ),
        });
        if (!resolvedTarget) return;

        if (location.pathname !== resolvedTarget.path) {
          navigate(resolvedTarget.path, { replace: true, state: resolvedTarget.state });
        }
      };

      void syncBySocketEvent();
    };

    // Подписка на глобальное событие изменения статуса и корректная отписка при unmount.
    onEvent(socket, eventName, onGameStatusChanged);
    return () => {
      offEvent(socket, eventName, onGameStatusChanged);
    };
  }, [location.pathname, navigate]);

  return null;
}
