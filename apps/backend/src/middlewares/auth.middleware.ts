import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../common/response";

const JWT_SECRET = process.env.SECRET || "super-secret";

/**
 * Интерфейс для авторизации
 */
export interface AuthRequest extends Request {
  userId?: string;
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
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    throw new ApiError(401, "INVALID_TOKEN");
  }
}
