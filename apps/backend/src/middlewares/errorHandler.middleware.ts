import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../common/response";
import { error } from "../common/response";

/**
 * Глобальный обработчик ошибок HTTP.
 * Возвращает единый формат: `errorCode`, `message`, `details`.
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction, 
) {
  if (err instanceof ApiError) {
    return res
      .status(err.code)
      .json(error(err.code, err.errorCode, err.message, err.details));
  }

  return res
    .status(500)
    .json(error(500, "INTERNAL_ERROR"));
}
