import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { createServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { registerSocketHandlers } from '../../socket';
import { env } from '../../config/env';

let httpServer: ReturnType<typeof createServer>;
let ioServer: Server;
let port: number;
const clients: Array<ReturnType<typeof ioClient>> = [];

describe('Socket auth middleware', () => {
  beforeAll(async () => {
    httpServer = createServer();
    ioServer = new Server(httpServer, { cors: { origin: '*' } });
    registerSocketHandlers(ioServer);

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    port = (httpServer.address() as { port: number }).port;
  });

  afterAll(() => {
    ioServer.disconnectSockets(true);
    ioServer.close();
    httpServer.close();
  });

  afterEach(() => {
    for (const client of clients.splice(0)) {
      client.removeAllListeners();
      client.close();
    }
  });

  it('accepts connection with valid JWT', async () => {
    const validToken = jwt.sign({ sub: 'socket-test-user' }, env.SECRET);

    const socket = ioClient(`http://localhost:${port}`, {
      auth: { token: validToken },
      reconnection: false,
    });
    clients.push(socket);

    await new Promise<void>((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });

    expect(socket.connected).toBeTrue();
  });

  it('rejects connection without token', async () => {
    const socket = ioClient(`http://localhost:${port}`, {
      reconnection: false,
    });
    clients.push(socket);

    const connectError = await new Promise<Error>((resolve) => {
      socket.once('connect_error', (error) => resolve(error));
    });

    expect(connectError.message).toBe('UNAUTHORIZED');
  });
});
