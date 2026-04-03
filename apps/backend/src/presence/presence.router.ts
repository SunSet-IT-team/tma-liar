import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { ApiError } from '../common/response';
import { GuestPresenceModel } from './guest-presence.model';

const GUEST_ID_RE = /^guest_[a-zA-Z0-9_]+$/;

const guestPresenceLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 429,
    errorCode: 'GUEST_PRESENCE_RATE_LIMIT',
    message: 'GUEST_PRESENCE_RATE_LIMIT',
    payload: null,
  },
});

export const presenceRouter = Router();

presenceRouter.use(guestPresenceLimiter);

presenceRouter.post(
  '/guest',
  asyncHandler(async (req, res) => {
    const body = req.body as { guestId?: unknown; nickname?: unknown };
    const guestId = typeof body.guestId === 'string' ? body.guestId.trim() : '';
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';

    if (!GUEST_ID_RE.test(guestId)) {
      throw new ApiError(422, 'INVALID_GUEST_ID');
    }
    if (nickname.length === 0 || nickname.length > 64) {
      throw new ApiError(422, 'INVALID_NICKNAME');
    }

    await GuestPresenceModel.updateOne(
      { guestId },
      {
        $set: {
          guestId,
          nickname,
          lastActiveAt: new Date(),
        },
      },
      { upsert: true },
    );

    res.status(204).send();
  }),
);
