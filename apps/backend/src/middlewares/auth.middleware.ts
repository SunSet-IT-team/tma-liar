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
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "INVALID_TOKEN");
  }
}
