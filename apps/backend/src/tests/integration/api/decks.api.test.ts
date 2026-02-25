import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import http from 'node:http';
import express from 'express';
import { sign } from '@tma.js/init-data-node';
import { connectToDatabase } from '../../../database/database';
import authRouter from '../../../auth/auth.router';
import { deckRouter } from '../../../decks/deck.router';
import { UserModel } from '../../../users/user.model';
import { DeckModel } from '../../../decks/deck.model';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { errorMiddleware } from '../../../middlewares/errorHandler.middleware';
import { env } from '../../../config/env';

let server: http.Server;
let baseUrl: string;
let authToken = '';
const runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';

const ts = Date.now();
const testTelegramId = `${ts}`;
const createDeckBody = {
  name: `Test Deck ${ts}`,
  questionsCount: 10,
  cover: 'https://example.com/deck-cover.jpg',
  questions: [
    { id: 'q1', type: 'general', content: 'What is your favorite color?', complexity: 1 },
    { id: 'q2', type: 'general', content: 'What is your favorite food?', complexity: 1 },
  ],
};

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
  app.use('/api/decks', authMiddleware, deckRouter);
  app.use(errorMiddleware);

  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;
  baseUrl = `http://localhost:${port}`;

  const initData = sign(
    {
      user: {
        id: Number(testTelegramId),
        first_name: 'Deck',
        username: `deck_test_${testTelegramId}`,
      },
    },
    env.TELEGRAM_BOT_TOKEN,
    new Date(),
  );

  const loginResponse = await request('POST', '/api/auth/tma', { initData });
  expect(loginResponse.status).toBe(200);

  const token = (loginResponse.data as { payload?: { token?: string } }).payload?.token;
  expect(token).toBeString();
  authToken = token as string;
});

afterAll(async () => {
  if (!runIntegration) return;

  await DeckModel.deleteMany({ name: createDeckBody.name });
  await UserModel.deleteMany({ telegramId: testTelegramId });
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('Decks API', () => {
  it('creates, reads and deletes deck', async () => {
    if (!runIntegration) return;

    const createResponse = await request('POST', '/api/decks', createDeckBody, authToken);
    expect(createResponse.status).toBe(200);

    const createdDeckId = (createResponse.data as { payload?: { id?: string } }).payload?.id;
    expect(createdDeckId).toBeString();

    const findResponse = await request('GET', `/api/decks/${createdDeckId}`, undefined, authToken);
    expect(findResponse.status).toBe(200);

    const deleteResponse = await request('DELETE', `/api/decks/${createdDeckId}`, undefined, authToken);
    expect(deleteResponse.status).toBe(200);
  });

  it('returns 422 for invalid deck payload', async () => {
    if (!runIntegration) return;

    const response = await request(
      'POST',
      '/api/decks',
      { name: '', questionsCount: -1, cover: '', questions: [] },
      authToken,
    );

    expect(response.status).toBe(422);
  });
});
