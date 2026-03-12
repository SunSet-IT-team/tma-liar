import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import http from 'node:http';
import express from 'express';
import { connectToDatabase } from '../../../database/database';
import { errorMiddleware } from '../../../middlewares/errorHandler.middleware';
import { userRouter } from '../../../users/user.router';
import { UserModel } from '../../../users/user.model';

let server: http.Server;
let baseUrl: string;
const runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';

const ts = Date.now();
const testTelegramId = `test-user-${ts}`;
const createUserBody = {
  telegramId: testTelegramId,
  nickname: `TestUser${ts}`,
  profileImg: 'https://example.com/avatar.png',
};

async function request(method: string, path: string, body?: object) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
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
  app.use('/api/users', userRouter);
  app.use(errorMiddleware);

  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;
  baseUrl = `http://localhost:${port}`;
});

afterAll(async () => {
  if (!runIntegration) return;

  await UserModel.deleteMany({ telegramId: testTelegramId });
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('Users API', () => {
  it('returns 422 for invalid users query', async () => {
    if (!runIntegration) return;

    const response = await request('GET', '/api/users');
    expect(response.status).toBe(422);
  });

  it('creates and reads user successfully', async () => {
    if (!runIntegration) return;

    const createResponse = await request('POST', '/api/users', createUserBody);
    expect(createResponse.status).toBe(200);

    const findResponse = await request('GET', `/api/users/${testTelegramId}`);
    expect(findResponse.status).toBe(200);

    const payload = (findResponse.data as { payload?: { telegramId?: string; nickname?: string } }).payload;
    expect(payload?.telegramId).toBe(testTelegramId);
    expect(payload?.nickname).toBe(createUserBody.nickname);
  });

  it('returns 404 for unknown user', async () => {
    if (!runIntegration) return;

    const response = await request('GET', '/api/users/non-existent-telegram-id-12345');
    expect(response.status).toBe(404);
  });
});
