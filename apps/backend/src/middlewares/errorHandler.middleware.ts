import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../common/response";
import { error } from "../common/response";

/**
 * Мидлварь для хендла ошибок 
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction, 
) {
  if (err instanceof ApiError) {
  return res
    .status(err.code)
    .json(error(err.code, err.message));
  }

  return res
    .status(500)
    .json(error(500, "INTERNAL_ERROR" ));
}
