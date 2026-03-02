import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../common/response";
import { error } from "../common/response";
import { logger } from "../observability/logger";
import { MulterError } from 'multer';

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
  const bodyParserError = err as Error & { type?: string; status?: number; limit?: number };
  if (bodyParserError.type === 'entity.too.large' || bodyParserError.status === 413) {
    return res
      .status(413)
      .json(error(413, 'PAYLOAD_TOO_LARGE', 'PAYLOAD_TOO_LARGE'));
  }

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(413)
        .json(error(413, 'PROFILE_IMAGE_TOO_LARGE', 'PROFILE_IMAGE_TOO_LARGE'));
    }

    return res
      .status(422)
      .json(error(422, 'MULTIPART_INVALID', 'MULTIPART_INVALID'));
  }

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
