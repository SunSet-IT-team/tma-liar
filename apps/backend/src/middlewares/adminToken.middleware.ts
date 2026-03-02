import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../common/response';
import { AdminTokenRepository } from '../admin-tokens/admin-token.repository';
import { hashAdminToken } from '../admin-tokens/admin-token.utils';

const repo = new AdminTokenRepository();

export async function adminTokenMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers['x-admin-token'];

  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new ApiError(403, 'ADMIN_TOKEN_REQUIRED');
  }

  const normalized = token.trim();
  const tokenHash = hashAdminToken(normalized);
  const found = await repo.findActiveByHash(tokenHash);

  if (!found) {
    throw new ApiError(403, 'INVALID_ADMIN_TOKEN');
  }

  void repo.markUsed(found.id);
  next();
}
