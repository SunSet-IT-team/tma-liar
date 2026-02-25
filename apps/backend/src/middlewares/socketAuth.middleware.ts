import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';

export type SocketAuthPayload = {
  sub?: string;
  userId?: string;
};

const SECRET = process.env.SECRET ?? 'super-secret';

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const raw = socket.handshake.auth?.token ?? socket.handshake.headers.authorization;

    if (!raw || typeof raw !== 'string') {
      return next(new Error('UNAUTHORIZED'));
    }

    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
    if (!token) {
      return next(new Error('INVALID_AUTH_HEADER'));
    }

    const payload = jwt.verify(token, SECRET) as SocketAuthPayload;
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
