import { describe, expect, it } from 'bun:test';
import jwt from 'jsonwebtoken';
import { socketAuthMiddleware } from '../../../middlewares/socketAuth.middleware';
import { env } from '../../../config/env';

function createSocket(raw?: unknown) {
  return {
    handshake: {
      auth: raw ? { token: raw } : {},
      headers: {},
    },
    data: {},
  } as never;
}

describe('socketAuthMiddleware', () => {
  it('accepts auth token from handshake.auth.token', () => {
    const token = jwt.sign({ sub: 'socket-user' }, env.SECRET);
    const socket = createSocket(token);

    let err: Error | undefined;
    socketAuthMiddleware(socket, (e?: Error) => {
      err = e;
    });

    expect(err).toBeUndefined();
    expect((socket as never as { data: { userId?: string } }).data.userId).toBe('socket-user');
  });

  it('accepts auth token from bearer header', () => {
    const token = jwt.sign({ userId: 'legacy-user' }, env.SECRET);
    const socket = {
      handshake: {
        auth: {},
        headers: { authorization: `Bearer ${token}` },
      },
      data: {},
    } as never;

    let err: Error | undefined;
    socketAuthMiddleware(socket, (e?: Error) => {
      err = e;
    });

    expect(err).toBeUndefined();
    expect((socket as never as { data: { userId?: string } }).data.userId).toBe('legacy-user');
  });

  it('rejects missing token', () => {
    const socket = createSocket();

    let err: Error | undefined;
    socketAuthMiddleware(socket, (e?: Error) => {
      err = e;
    });

    expect(err?.message).toBe('UNAUTHORIZED');
  });

  it('rejects empty bearer token', () => {
    const socket = createSocket('Bearer ');

    let err: Error | undefined;
    socketAuthMiddleware(socket, (e?: Error) => {
      err = e;
    });

    expect(err?.message).toBe('INVALID_AUTH_HEADER');
  });

  it('rejects token with invalid payload', () => {
    const token = jwt.sign({ foo: 'bar' }, env.SECRET);
    const socket = createSocket(token);

    let err: Error | undefined;
    socketAuthMiddleware(socket, (e?: Error) => {
      err = e;
    });

    expect(err?.message).toBe('INVALID_TOKEN_PAYLOAD');
  });

  it('rejects malformed token', () => {
    const socket = createSocket('malformed');

    let err: Error | undefined;
    socketAuthMiddleware(socket, (e?: Error) => {
      err = e;
    });

    expect(err?.message).toBe('INVALID_TOKEN');
  });
});
