import { describe, expect, it } from 'bun:test';
import type { NextFunction, Request, Response } from 'express';
import { errorMiddleware } from '../../../middlewares/errorHandler.middleware';
import { ApiError } from '../../../common/response';

function createRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('errorMiddleware', () => {
  it('returns ApiError payload', () => {
    const res = createRes();

    errorMiddleware(new ApiError(422, 'VALIDATION_ERROR', { field: 'name' }, 'bad'), {} as Request, res, (() => {}) as NextFunction);

    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({
      status: 'error',
      code: 422,
      errorCode: 'VALIDATION_ERROR',
      message: 'bad',
      details: { field: 'name' },
      payload: null,
    });
  });

  it('returns INTERNAL_ERROR for unknown errors', () => {
    const res = createRes();

    errorMiddleware(new Error('boom'), {} as Request, res, (() => {}) as NextFunction);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      status: 'error',
      code: 500,
      errorCode: 'INTERNAL_ERROR',
      message: 'INTERNAL_ERROR',
      details: undefined,
      payload: null,
    });
  });
});
