import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { connectToDatabase } from './database/database';
import { corsOrigin } from './config/cors';
import { env } from './config/env';
import { httpLogger, logger } from './observability/logger';

import { errorMiddleware } from './middlewares/errorHandler.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import authRouter from './auth/auth.router';
import { userRouter } from './users/user.router';
import { lobbyRouter } from './lobby/lobby.router';
import { deckRouter } from './decks/deck.router';
import { deckAdminRouter } from './decks/deck-admin.router';
import { paymentRouter } from './payments/payment.router';
import { adminUsersRouter } from './admin/admin-users.router';
import { adminLobbiesRouter } from './admin/admin-lobbies.router';
import { adminStatsRouter } from './admin/admin-stats.router';
import { createGameRouter } from './game/game.router';
import { registerSocketHandlers } from './socket';
import { startLobbyCleanupScheduler } from './lobby/lobby-cleanup.scheduler';
import path from 'node:path';

const app = express();
export const httpServer = createServer(app);
const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 429,
    errorCode: 'TOO_MANY_AUTH_REQUESTS',
    message: 'TOO_MANY_AUTH_REQUESTS',
    payload: null,
  },
});

export const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});
registerSocketHandlers(io);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);
app.use(httpLogger);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), 'uploads'), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
    },
  }),
);

app.get('/api/hello', (_, res) => res.status(200).json({ message: 'Hello from backend!' }));
app.get('/api/health', (_, res) =>
  res.status(200).json({
    status: 'ok',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  }),
);

/** Роуты без авторизации */
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/admin/decks', deckAdminRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/lobbies', adminLobbiesRouter);
app.use('/api/admin/stats', adminStatsRouter);

app.use('/api/users', authMiddleware, userRouter);

app.use('/api/lobbies', authMiddleware, lobbyRouter);
app.use('/api/decks', authMiddleware, deckRouter);
app.use('/api/game', authMiddleware, createGameRouter(io));

app.use(errorMiddleware);

/**
 * Запуск сервера
 */
async function startServer() {
  try {
    await connectToDatabase();
    startLobbyCleanupScheduler();
    httpServer.listen(env.PORT, () => logger.info({ port: env.PORT }, 'Server started'));
  } catch (error) {
    throw error;
  }
}

await startServer();
