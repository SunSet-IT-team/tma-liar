type ScreenLoader = () => Promise<unknown>;

const criticalGameScreens: ScreenLoader[] = [
  () => import('@pages/ChoosingLiar'),
  () => import('@pages/WaitingPlayers'),
  () => import('@pages/AnswerLiar'),
  () => import('@pages/AnswerSolved'),
  () => import('@pages/AnswersPlayers'),
  () => import('@pages/RatePlayers'),
  () => import('@pages/ResultGame'),
  () => import('@pages/EndGame'),
];

const secondaryScreens: ScreenLoader[] = [
  () => import('@pages/Home'),
  () => import('@pages/Profile'),
  () => import('@pages/ConnectLobby'),
  () => import('@pages/CreateLobby'),
  () => import('@pages/Rules'),
  () => import('@pages/Settings'),
  () => import('@pages/Lobby/LobbyAdmin'),
  () => import('@pages/Lobby/LobbyPlayer'),
  () => import('@pages/NotFound'),
];

let criticalPreloadPromise: Promise<PromiseSettledResult<unknown>[]> | null = null;
let secondaryScheduled = false;

type IdleCallback = (deadline: { timeRemaining: () => number; didTimeout: boolean }) => void;
type IdleRequest = (cb: IdleCallback, options?: { timeout: number }) => number;

const requestIdle = (
  typeof window !== 'undefined'
    ? (window as Window & { requestIdleCallback?: IdleRequest }).requestIdleCallback
    : undefined
) ?? ((cb: IdleCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 50));

async function preloadSequential(loaders: ScreenLoader[]) {
  for (const load of loaders) {
    // eslint-disable-next-line no-await-in-loop
    await load().catch(() => undefined);
    // Даем UI кадр между догрузками, чтобы не блокировать интерфейс.
    // eslint-disable-next-line no-await-in-loop
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });
  }
}

function scheduleSecondaryPreload() {
  if (secondaryScheduled) return;
  secondaryScheduled = true;

  requestIdle(() => {
    void preloadSequential(secondaryScreens);
  });
}

/**
 * Предзагрузка экранов приложения.
 * Сначала грузятся критичные игровые экраны, остальные — в фоне при idle.
 */
export function preloadAllScreens() {
  if (!criticalPreloadPromise) {
    criticalPreloadPromise = Promise.allSettled(criticalGameScreens.map((load) => load()));
  }

  scheduleSecondaryPreload();
  return criticalPreloadPromise;
}
