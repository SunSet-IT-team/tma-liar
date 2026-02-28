import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../common/response";
import { error } from "../common/response";
import { logger } from "../observability/logger";

/**
 * Глобальный обработчик ошибок HTTP.
 * Возвращает единый формат: `errorCode`, `message`, `details`.
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction, 
) {
  if (err instanceof ApiError) {
    return res
      .status(err.code)
      .json(error(err.code, err.errorCode, err.message, err.details));
  }

  logger.error(
    {
      method: req.method,
      url: req.originalUrl,
      message: err.message,
      stack: err.stack,
    },
    'Unhandled application error',
  );

  return res
    .status(500)
    .json(error(500, "INTERNAL_ERROR"));
}
