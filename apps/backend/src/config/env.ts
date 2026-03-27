import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../');

/**
 * Кандидаты для загрузки env.
 * Для тестов (`NODE_ENV=test`) сначала загружается `.env.test`,
 * затем корневой `.env` как fallback.
 */
const envCandidates =
  process.env.NODE_ENV === 'test'
    ? [path.resolve(projectRoot, '.env.test'), path.resolve(projectRoot, '.env')]
    : [path.resolve(projectRoot, '.env')];

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
  DISABLE_AUTH: z.enum(['true', 'false']).default('false'),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),
  TELEGRAM_BOT_TOKEN: z.string().default(''),
  TELEGRAM_INITDATA_EXPIRES_IN: z.coerce.number().int().positive().default(3600),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  SCORE_NOT_STATED: z.coerce.number().int().nonnegative().default(50),
  SCORE_TRICKED: z.coerce.number().int().nonnegative().default(100),
  /** Длительность стадий: вопрос лжецу, результаты вопроса, результаты игры (мс). */
  GAME_STAGE_TIMER_MS: z.coerce.number().int().positive().default(20000),
  /** Длительность стадии выбора лжеца (врать/нет) (мс). */
  LIAR_CHOOSES_TIMER_MS: z.coerce.number().int().positive().default(10000),
  HIDDEN_DURING_GAME_FIELDS: z.string().default('doLie,questionHistory,liarId,timerId'),
  GAME_RESULTS_FIELDS: z.string().default('doLie,loserTask,winnerId,loserId'),
  LOBBY_CODE_ALPHABET: z.string().min(1).default('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
  LOBBY_CODE_LENGTH: z.coerce.number().int().positive().default(6),
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_SECRET_KEY: z.string().optional(),
  YOOKASSA_RETURN_URL: z.string().url().optional(),
  YOOKASSA_WEBHOOK_TOKEN: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formatted = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`ENV_VALIDATION_FAILED: ${formatted}`);
}

if (parsedEnv.data.DISABLE_AUTH !== 'true' && parsedEnv.data.TELEGRAM_BOT_TOKEN.trim().length === 0) {
  throw new Error('ENV_VALIDATION_FAILED: TELEGRAM_BOT_TOKEN is required when DISABLE_AUTH=false');
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
  disableAuth: parsedEnv.data.DISABLE_AUTH === 'true',
  corsAllowedOrigins: splitCsv(parsedEnv.data.CORS_ALLOWED_ORIGINS),
  hiddenDuringGameFields: splitCsv(parsedEnv.data.HIDDEN_DURING_GAME_FIELDS),
  gameResultsFields: splitCsv(parsedEnv.data.GAME_RESULTS_FIELDS),
} as const;
