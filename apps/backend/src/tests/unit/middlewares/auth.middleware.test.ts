import { describe, expect, it } from 'bun:test';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { authMiddleware, type AuthRequest } from '../../../middlewares/auth.middleware';
import { env } from '../../../config/env';
import { ApiError } from '../../../common/response';

function createReq(authHeader?: string): AuthRequest {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as AuthRequest;
}

describe('authMiddleware', () => {
  it('throws UNAUTHORIZED when no header', () => {
    const req = createReq();
    expect(() => authMiddleware(req, {} as Response, (() => {}) as NextFunction)).toThrowError(ApiError);
  });

  it('throws INVALID_AUTH_HEADER for non-bearer', () => {
    const req = createReq('Basic token');
    expect(() => authMiddleware(req, {} as Response, (() => {}) as NextFunction)).toThrowError(ApiError);
  });

  it('throws INVALID_AUTH_HEADER for empty token', () => {
    const req = createReq('Bearer ');
    expect(() => authMiddleware(req, {} as Response, (() => {}) as NextFunction)).toThrowError(ApiError);
  });

  it('sets req.auth/req.userId from sub', () => {
    const token = jwt.sign({ sub: 'user-1' }, env.SECRET);
    const req = createReq(`Bearer ${token}`);

    let nextCalled = false;
    authMiddleware(req, {} as Response, (() => {
      nextCalled = true;
    }) as NextFunction);

    expect(nextCalled).toBeTrue();
    expect(req.userId).toBe('user-1');
    expect(req.auth?.userId).toBe('user-1');
  });

  it('sets req.auth/req.userId from legacy userId claim', () => {
    const token = jwt.sign({ userId: 'legacy-1' }, env.SECRET);
    const req = createReq(`Bearer ${token}`);

    authMiddleware(req, {} as Response, (() => {}) as NextFunction);
    expect(req.userId).toBe('legacy-1');
  });

  it('throws INVALID_TOKEN_PAYLOAD when no sub/userId in payload', () => {
    const token = jwt.sign({ foo: 'bar' }, env.SECRET);
    const req = createReq(`Bearer ${token}`);

    expect(() => authMiddleware(req, {} as Response, (() => {}) as NextFunction)).toThrowError(ApiError);
  });

  it('throws INVALID_TOKEN when jwt is malformed', () => {
    const req = createReq('Bearer malformed');
    expect(() => authMiddleware(req, {} as Response, (() => {}) as NextFunction)).toThrowError(ApiError);
  });
});
