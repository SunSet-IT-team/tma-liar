import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../common/response";
import { env } from "../config/env";

/**
 * Интерфейс для авторизации
 */
export interface AuthRequest extends Request {
  userId?: string;
  auth?: {
    userId: string;
    sub: string;
  };
}

/**
 * Мидлварь для авторизации 
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  const authorizeByToken = () => {
    if (!authHeader) {
      throw new ApiError(401, "UNAUTHORIZED");
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      throw new ApiError(401, "INVALID_AUTH_HEADER");
    }

    try {
      const payload = jwt.verify(token, env.SECRET) as unknown as { sub?: string; userId?: string };
      const normalizedUserId = payload.sub ?? payload.userId;

      if (!normalizedUserId) {
        throw new ApiError(401, "INVALID_TOKEN_PAYLOAD");
      }

      req.userId = normalizedUserId;
      req.auth = {
        userId: normalizedUserId,
        sub: normalizedUserId,
      };
      return next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(401, "INVALID_TOKEN");
    }
  };

  if (env.disableAuth) {
    // В dev-режиме не ломаем авторизацию по токену, если токен передан.
    if (authHeader) {
      try {
        return authorizeByToken();
      } catch {
        // В обычном dev-режиме игнорируем битый токен и уходим в fallback.
        if (process.env.NODE_ENV === 'test') {
          throw new ApiError(401, "INVALID_TOKEN");
        }
      }
    }

    const devUserIdHeader = req.headers['x-dev-user-id'];
    const strictDevAuth = process.env.NODE_ENV === 'test';
    if (!(typeof devUserIdHeader === "string" && devUserIdHeader.trim().length > 0)) {
      if (strictDevAuth) {
        throw new ApiError(401, "UNAUTHORIZED");
      }
      const fallbackDevUserId = 'dev-user';
      req.userId = fallbackDevUserId;
      req.auth = {
        userId: fallbackDevUserId,
        sub: fallbackDevUserId,
      };
      return next();
    }
    const devUserId = devUserIdHeader.trim();

    req.userId = devUserId;
    req.auth = {
      userId: devUserId,
      sub: devUserId,
    };
    return next();
  }

  return authorizeByToken();
}
