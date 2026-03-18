import { LobbyModel } from './lobby.model';
import { logger } from '../observability/logger';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour of inactivity

let timer: ReturnType<typeof setInterval> | null = null;

async function cleanupStaleLobbies() {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  try {
    const result = await LobbyModel.deleteMany({ updatedAt: { $lt: cutoff } });

    if (result.deletedCount > 0) {
      logger.info(
        { deletedCount: result.deletedCount, cutoff: cutoff.toISOString() },
        'Stale lobbies cleaned up',
      );
    }
  } catch (error) {
    logger.error({ error }, 'Failed to clean up stale lobbies');
  }
}

export function startLobbyCleanupScheduler() {
  if (timer) return;

  logger.info(
    { intervalMs: CLEANUP_INTERVAL_MS, thresholdMs: STALE_THRESHOLD_MS },
    'Lobby cleanup scheduler started',
  );

  void cleanupStaleLobbies();

  timer = setInterval(() => {
    void cleanupStaleLobbies();
  }, CLEANUP_INTERVAL_MS);
}

export function stopLobbyCleanupScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
