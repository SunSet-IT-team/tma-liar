import { GuestPresenceModel } from './guest-presence.model';
import { UserModel } from '../users/user.model';
import { logger } from '../observability/logger';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Если дольше нет heartbeat, запись присутствия не нужна ни для «активных сейчас», ни для хранения.
 * (Окно в админке — ~3 мин; порог очистки — сутки, с запасом.)
 */
const STALE_PRESENCE_MS = 24 * 60 * 60 * 1000;

let timer: ReturnType<typeof setInterval> | null = null;

async function cleanupStalePresence() {
  const cutoff = new Date(Date.now() - STALE_PRESENCE_MS);

  try {
    const guests = await GuestPresenceModel.deleteMany({ lastActiveAt: { $lt: cutoff } });
    if (guests.deletedCount > 0) {
      logger.info(
        { deletedCount: guests.deletedCount, cutoff: cutoff.toISOString() },
        'Stale guest presence records removed',
      );
    }

    const users = await UserModel.updateMany(
      { lastActiveAt: { $exists: true, $lt: cutoff } },
      { $unset: { lastActiveAt: '' } },
    );
    if (users.modifiedCount > 0) {
      logger.info(
        { modifiedCount: users.modifiedCount, cutoff: cutoff.toISOString() },
        'Stale user lastActiveAt cleared',
      );
    }
  } catch (error) {
    logger.error({ error }, 'Failed to clean up stale presence data');
  }
}

export function startPresenceCleanupScheduler() {
  if (timer) return;

  logger.info(
    { intervalMs: CLEANUP_INTERVAL_MS, staleAfterMs: STALE_PRESENCE_MS },
    'Presence cleanup scheduler started',
  );

  void cleanupStalePresence();

  timer = setInterval(() => {
    void cleanupStalePresence();
  }, CLEANUP_INTERVAL_MS);
}

export function stopPresenceCleanupScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
