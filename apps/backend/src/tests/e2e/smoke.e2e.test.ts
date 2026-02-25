import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import http from 'node:http';
import { createServer } from 'node:http';
import express from 'express';
import { sign } from '@tma.js/init-data-node';
import { Server } from 'socket.io';
import authRouter from '../../auth/auth.router';
import { env } from '../../config/env';
import { connectToDatabase } from '../../database/database';
import { errorMiddleware } from '../../middlewares/errorHandler.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { lobbyRouter } from '../../lobby/lobby.router';
import { LobbyService } from '../../lobby/lobby.service';
import { GameService } from '../../game/game.service';
import { LobbyModel } from '../../lobby/lobby.model';
import { GameModel } from '../../game/game.model';
import { UserModel } from '../../users/user.model';
import { GameStages, LobbyStatus } from '../../lobby/entities/lobby.entity';

let server: http.Server;
let baseUrl: string;
let ioServer: Server;
let createdLobbyCode: string | null = null;
const runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';

const ts = Date.now();
const adminTelegramId = String(ts);
const playerTelegramId = String(ts + 1);

async function request(method: string, path: string, body?: object, token?: string) {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

beforeAll(async () => {
  if (!runIntegration) return;

  await connectToDatabase();

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/lobbies', authMiddleware, lobbyRouter);
  app.use(errorMiddleware);

  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;
  baseUrl = `http://localhost:${port}`;

  ioServer = new Server(createServer(), { cors: { origin: '*' } });
});

afterAll(async () => {
  if (!runIntegration) return;

  if (createdLobbyCode) {
    await GameModel.deleteMany({ lobbyCode: createdLobbyCode });
    await LobbyModel.deleteMany({ lobbyCode: createdLobbyCode });
  }
  await UserModel.deleteMany({ telegramId: { $in: [adminTelegramId, playerTelegramId] } });

  ioServer.close();

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('Smoke flow: login -> create lobby -> join -> start game', () => {
  it('executes key domain scenario', async () => {
    if (!runIntegration) return;

    const initData = sign(
      {
        user: {
          id: Number(adminTelegramId),
          first_name: 'Admin',
          username: `admin_${adminTelegramId}`,
        },
      },
      env.TELEGRAM_BOT_TOKEN,
      new Date(),
    );

    const loginResponse = await request('POST', '/api/auth/tma', { initData });
    expect(loginResponse.status).toBe(200);

    const token = (loginResponse.data as { payload?: { token?: string } }).payload?.token;
    expect(token).toBeString();

    const adminPlayer = {
      id: adminTelegramId,
      telegramId: adminTelegramId,
      nickname: `Admin_${adminTelegramId}`,
      profileImg: 'https://example.com/admin.png',
      score: 0,
      isReady: true,
      loserTask: 'task',
      wasLiar: 0,
      answer: null,
      likes: 0,
      isConfirmed: false,
    };

    const createLobbyPayload = {
      adminId: adminTelegramId,
      players: [adminPlayer],
      settings: {
        deckId: `deck-${ts}`,
        questionCount: 2,
        answerTime: 30,
        deck: {
          name: `Smoke deck ${ts}`,
          questionsCount: 2,
          cover: 'https://example.com/deck.png',
          questions: [
            { id: 'q1', type: 'general', content: 'Q1', complexity: 1 },
            { id: 'q2', type: 'general', content: 'Q2', complexity: 1 },
          ],
        },
      },
    };

    const createLobbyResponse = await request('POST', '/api/lobbies', createLobbyPayload, token as string);
    expect(createLobbyResponse.status).toBe(200);

    const lobbyCode = (createLobbyResponse.data as { payload?: { lobbyCode?: string } }).payload?.lobbyCode;
    expect(lobbyCode).toBeString();
    createdLobbyCode = lobbyCode as string;

    const lobbyService = new LobbyService();
    const joinedLobby = await lobbyService.joinLobby({
      lobbyCode: lobbyCode as string,
      player: {
        id: playerTelegramId,
        telegramId: playerTelegramId,
        nickname: `Player_${playerTelegramId}`,
        profileImg: 'https://example.com/player.png',
        score: 0,
        isReady: true,
        loserTask: 'task2',
        wasLiar: 0,
        answer: null,
        likes: 0,
        isConfirmed: false,
      },
    });

    expect(joinedLobby.players.length).toBeGreaterThanOrEqual(2);

    const gameService = new GameService(ioServer);
    const startedGame = await gameService.createGame({
      lobbyCode: lobbyCode as string,
      player: adminPlayer,
      settings: createLobbyPayload.settings,
      stage: GameStages.LOBBY,
      liarId: null,
      questionHistory: [],
      activeQuestion: null,
      timerId: null,
      doLie: null,
      loserTask: null,
      winnerId: null,
      loserId: null,
    });

    expect(startedGame.stage).toBe(GameStages.LOBBY);

    const updatedLobby = await LobbyModel.findOne({ lobbyCode }).lean();
    expect(updatedLobby?.status).toBe(LobbyStatus.STARTED);
    expect(updatedLobby?.currentGameId).toBeString();
  });
});
