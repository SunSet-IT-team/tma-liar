import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import http from 'node:http';
import express from 'express';
import { sign } from '@tma.js/init-data-node';
import authRouter from '../../../auth/auth.router';
import { connectToDatabase } from '../../../database/database';
import { errorMiddleware } from '../../../middlewares/errorHandler.middleware';
import { UserModel } from '../../../users/user.model';
import { env } from '../../../config/env';

let server: http.Server;
let baseUrl: string;
const runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';

const ts = Date.now();
const testTelegramId = String(ts + 2000);

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
  app.use('/api/auth', authRouter);
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

describe('Auth API', () => {
  it('returns 200 and token for valid initData', async () => {
    if (!runIntegration) return;

    const initData = sign(
      {
        user: {
          id: Number(testTelegramId),
          first_name: 'Auth',
          username: `auth_${testTelegramId}`,
        },
      },
      env.TELEGRAM_BOT_TOKEN,
      new Date(),
    );

    const response = await request('POST', '/api/auth/tma', { initData });

    expect(response.status).toBe(200);
    const token = (response.data as { payload?: { token?: string } }).payload?.token;
    expect(token).toBeString();
  });

  it('returns 422 for invalid payload', async () => {
    if (!runIntegration) return;

    const response = await request('POST', '/api/auth/tma', {});

    expect(response.status).toBe(422);
    expect((response.data as { errorCode?: string }).errorCode).toBe('LOGIN_DATA_INVALID');
  });

  it('returns 401 for tampered initData', async () => {
    if (!runIntegration) return;

    const response = await request('POST', '/api/auth/tma', { initData: 'bad-init-data' });

    expect(response.status).toBe(401);
    expect((response.data as { errorCode?: string }).errorCode).toBe('INIT_DATA_INVALID');
  });
});
