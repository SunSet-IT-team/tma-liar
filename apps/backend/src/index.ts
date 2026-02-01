import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './database/database';
import { userController } from './users/user.controller';
import { errorMiddleware } from './middlewares/errorHandler.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import { authController } from './auth/auth.controller';
import { lobbyController } from './lobby/lobby.controller';
import { deckController } from './decks/deck.controller';
import { gameController } from './game/game.controller';

const app = express();

app.use(cors());
app.use(express.json()); 

app.get('/api/hello', (_, res) => res.status(200).json({ message: 'Hello from backend!' }));

app.use('/api/auth', authController);

app.use('/api/users', userController, authMiddleware);

app.use('/api/lobbies', lobbyController);

app.use('/api/decks', deckController);

app.use('/api/game', gameController);

app.use(errorMiddleware);

/**
 * Функция для запуска сервера
 */
async function startServer() {
    try {
      console.log('Starting server...');
      await connectToDatabase();
      console.log('Database connected');
  
      app.listen(3000, () =>
        console.log('🚀 Server running on http://localhost:3000')
      );
    } catch (error) {
      console.error('START SERVER ERROR:', error);
      process.exit(1);
    }
  }
  
  startServer();