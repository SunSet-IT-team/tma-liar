import "./config/loadEnv";
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { connectToDatabase } from './database/database';
import { corsOrigin } from './config/cors';

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const AUTH_RATE_LIMIT_WINDOW_MS = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '60000', 10);
const AUTH_RATE_LIMIT_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '30', 10);
import { errorMiddleware } from './middlewares/errorHandler.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import authRouter from './auth/auth.router';
import { userRouter } from './users/user.router';
import { lobbyRouter } from './lobby/lobby.router';
import { deckRouter } from './decks/deck.router';
import { createGameRouter } from './game/game.router';
import { registerSocketHandlers } from './socket';

const app = express();
export const httpServer = createServer(app);
const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  limit: AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 429,
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
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.get('/api/hello', (_, res) => res.status(200).json({ message: 'Hello from backend!' }));

/** Роуты без авторизации */
app.use('/api/auth', authRateLimiter, authRouter);

app.use('/api/users', authMiddleware, userRouter);

app.use('/api/lobbies', authMiddleware, lobbyRouter);
app.use('/api/decks', authMiddleware,deckRouter);
app.use('/api/game', authMiddleware, createGameRouter(io));

app.use(errorMiddleware);

/**
 * Запуск сервера
 */
async function startServer() {
  try {
    await connectToDatabase();
    httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (error) {
    throw error;
  }
}

await startServer();
