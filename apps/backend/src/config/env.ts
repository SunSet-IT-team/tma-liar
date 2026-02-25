import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Кандидаты для загрузки env.
 * В текущей конфигурации backend использует только корневой `.env` проекта.
 */
const envCandidates = [
  path.resolve(__dirname, '../../../../.env'),
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath, override: false });
}

/**
 * Централизованная схема env-переменных backend.
 * Здесь фиксируются обязательные ключи и дефолтные значения.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DB_CONN_STRING: z.string().min(1, 'DB_CONN_STRING is required'),
  DB_NAME: z.string().min(1).default('liar'),
  SECRET: z.string().min(1, 'SECRET is required'),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_INITDATA_EXPIRES_IN: z.coerce.number().int().positive().default(3600),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  SCORE_NOT_STATED: z.coerce.number().int().nonnegative().default(50),
  SCORE_TRICKED: z.coerce.number().int().nonnegative().default(100),
  GAME_STAGE_TIMER_MS: z.coerce.number().int().positive().default(1000),
  HIDDEN_DURING_GAME_FIELDS: z.string().default('doLie,questionHistory,liarId,timerId'),
  GAME_RESULTS_FIELDS: z.string().default('doLie,loserTask,winnerId,loserId'),
  LOBBY_CODE_ALPHABET: z.string().min(1).default('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
  LOBBY_CODE_LENGTH: z.coerce.number().int().positive().default(6),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formatted = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`ENV_VALIDATION_FAILED: ${formatted}`);
}

const splitCsv = (value: string): string[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

/**
 * Нормализованный и валидированный env-конфиг приложения.
 * Используется как единый источник конфигурации вместо прямых `process.env`.
 */
export const env = {
  ...parsedEnv.data,
  corsAllowedOrigins: splitCsv(parsedEnv.data.CORS_ALLOWED_ORIGINS),
  hiddenDuringGameFields: splitCsv(parsedEnv.data.HIDDEN_DURING_GAME_FIELDS),
  gameResultsFields: splitCsv(parsedEnv.data.GAME_RESULTS_FIELDS),
} as const;
