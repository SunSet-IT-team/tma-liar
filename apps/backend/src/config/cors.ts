import { env } from './env';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

function parseAllowedOrigins(raw?: string): string[] {
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;

  const parsed = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS;
}

function isWildcardPattern(pattern: string): boolean {
  return pattern.startsWith('*.');
}

function matchesWildcardOrigin(origin: string, pattern: string): boolean {
  if (!isWildcardPattern(pattern)) return false;

  let originHost = origin;
  try {
    originHost = new URL(origin).hostname;
  } catch {
    // keep raw origin as-is for non-standard values
  }

  const domain = pattern.slice(2);
  return originHost.endsWith(`.${domain}`) || originHost === domain;
}

export const allowedOrigins = parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS);

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;

  return allowedOrigins.some((allowed) => {
    if (allowed === origin) return true;
    return matchesWildcardOrigin(origin, allowed);
  });
}

export function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error('CORS_ORIGIN_NOT_ALLOWED'));
}
