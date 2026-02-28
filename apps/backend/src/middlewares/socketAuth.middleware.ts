import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import { env } from '../config/env';

export type SocketAuthPayload = {
  sub?: string;
  userId?: string;
};

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  if (env.disableAuth) {
    const userIdFromAuth = socket.handshake.auth?.userId;
    const userIdFromQuery = socket.handshake.query?.userId;
    const normalizedUserId =
      (typeof userIdFromAuth === 'string' && userIdFromAuth.trim().length > 0 && userIdFromAuth.trim()) ||
      (typeof userIdFromQuery === 'string' && userIdFromQuery.trim().length > 0 && userIdFromQuery.trim()) ||
      'dev-user';

    socket.data.userId = normalizedUserId;
    return next();
  }

  try {
    const raw = socket.handshake.auth?.token ?? socket.handshake.headers.authorization;

    if (!raw || typeof raw !== 'string') {
      return next(new Error('UNAUTHORIZED'));
    }

    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
    if (!token) {
      return next(new Error('INVALID_AUTH_HEADER'));
    }

    const payload = jwt.verify(token, env.SECRET) as SocketAuthPayload;
    const userId = payload.sub ?? payload.userId;

    if (!userId) {
      return next(new Error('INVALID_TOKEN_PAYLOAD'));
    }

    socket.data.userId = userId;
    return next();
  } catch {
    return next(new Error('INVALID_TOKEN'));
  }
}
