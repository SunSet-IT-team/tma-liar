import { createHash, randomBytes } from 'node:crypto';

export function hashAdminToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateAdminToken(): { token: string; prefix: string } {
  const raw = randomBytes(24).toString('hex');
  const prefix = raw.slice(0, 8);
  return {
    token: `deckadm_${raw}`,
    prefix,
  };
}
