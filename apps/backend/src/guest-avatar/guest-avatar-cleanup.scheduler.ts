import path from 'node:path';
import { readdir, stat, unlink } from 'node:fs/promises';
import { env } from '../config/env';
import { logger } from '../observability/logger';

let timer: ReturnType<typeof setInterval> | null = null;

async function cleanupOldGuestAvatars() {
  const dir = path.resolve(process.cwd(), 'uploads', 'guest-avatars');
  const ttlMs = env.GUEST_AVATAR_TTL_DAYS * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - ttlMs;

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') {
      return;
    }
    logger.error({ error }, 'Guest avatar cleanup: failed to read directory');
    return;
  }

  let removed = 0;
  for (const name of entries) {
    if (!name.startsWith('guest--') || !name.endsWith('.jpg')) {
      continue;
    }
    const full = path.join(dir, name);
    try {
      const st = await stat(full);
      if (!st.isFile()) continue;
      if (st.mtimeMs < cutoff) {
        await unlink(full);
        removed += 1;
      }
    } catch (error) {
      logger.warn({ error, name }, 'Guest avatar cleanup: skip file');
    }
  }

  if (removed > 0) {
    logger.info(
      { removed, ttlDays: env.GUEST_AVATAR_TTL_DAYS, cutoff: new Date(cutoff).toISOString() },
      'Old guest avatars removed',
    );
  }
}

export function startGuestAvatarCleanupScheduler() {
  if (timer) return;

  logger.info(
    {
      intervalMs: env.GUEST_AVATAR_CLEANUP_INTERVAL_MS,
      ttlDays: env.GUEST_AVATAR_TTL_DAYS,
    },
    'Guest avatar cleanup scheduler started',
  );

  void cleanupOldGuestAvatars();

  timer = setInterval(() => {
    void cleanupOldGuestAvatars();
  }, env.GUEST_AVATAR_CLEANUP_INTERVAL_MS);
}

export function stopGuestAvatarCleanupScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
