import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import { env } from '../config/env';

export type SocketAuthPayload = {
  sub?: string;
  userId?: string;
};

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const authorizeByToken = (raw: string) => {
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
    if (!token) {
      return next(new Error('INVALID_AUTH_HEADER'));
    }

    try {
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
  };

  if (env.disableAuth) {
    const tokenFromAuth = socket.handshake.auth?.token;
    const tokenFromHeader = socket.handshake.headers.authorization;
    const rawToken =
      (typeof tokenFromAuth === 'string' && tokenFromAuth) ||
      (typeof tokenFromHeader === 'string' && tokenFromHeader) ||
      null;

    // В dev-режиме поддерживаем нормальный JWT flow, если токен передан.
    if (rawToken) {
      if (process.env.NODE_ENV === 'test') {
        return authorizeByToken(rawToken);
      }

      try {
        const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
        if (token) {
          const payload = jwt.verify(token, env.SECRET) as SocketAuthPayload;
          const userId = payload.sub ?? payload.userId;
          if (userId) {
            socket.data.userId = userId;
            return next();
          }
        }
      } catch {
        // В dev-режиме игнорируем битый токен и используем fallback userId ниже.
      }
    }

    const userIdFromAuth = socket.handshake.auth?.userId;
    const userIdFromQuery = socket.handshake.query?.userId;
    const userIdFromHeader = socket.handshake.headers['x-dev-user-id'];
    const normalizedUserId =
      (typeof userIdFromAuth === 'string' && userIdFromAuth.trim().length > 0 && userIdFromAuth.trim()) ||
      (typeof userIdFromQuery === 'string' && userIdFromQuery.trim().length > 0 && userIdFromQuery.trim()) ||
      (typeof userIdFromHeader === 'string' && userIdFromHeader.trim().length > 0 && userIdFromHeader.trim()) ||
      null;

    if (!normalizedUserId) {
      if (process.env.NODE_ENV === 'test') {
        return next(new Error('UNAUTHORIZED'));
      }
      socket.data.userId = 'dev-user';
      return next();
    }

    socket.data.userId = normalizedUserId;
    return next();
  }

  const raw = socket.handshake.auth?.token ?? socket.handshake.headers.authorization;
  if (!raw || typeof raw !== 'string') {
    return next(new Error('UNAUTHORIZED'));
  }

  return authorizeByToken(raw);
}
