import "./config/loadEnv";
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { connectToDatabase } from './database/database';

const PORT = parseInt(process.env.PORT ?? "3000", 10);
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

export const io = new Server(httpServer, {
  cors: { origin: '*' },
});
registerSocketHandlers(io);

app.use(cors());
app.use(express.json());

app.get('/api/hello', (_, res) => res.status(200).json({ message: 'Hello from backend!' }));

/** Роуты без авторизации */
app.use('/api/auth', authRouter);

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
