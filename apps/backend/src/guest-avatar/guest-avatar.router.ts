import { Router, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { ApiError, success } from '../common/response';
import { logger } from '../observability/logger';

const GUEST_ID_RE = /^guest_[a-zA-Z0-9_]+$/;

const uploadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 429,
    errorCode: 'GUEST_AVATAR_RATE_LIMIT',
    message: 'GUEST_AVATAR_RATE_LIMIT',
    payload: null,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

function sanitizeGuestIdForFilename(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

export const guestAvatarRouter = Router();

guestAvatarRouter.use(uploadLimiter);

/**
 * Загрузка аватара гостя (без JWT): файл на диск, в ответе путь `/uploads/guest-avatars/...`.
 * Имя файла: guest--<guestId>--<дата загрузки YYYY-MM-DD>--<nanoid>.jpg
 */
guestAvatarRouter.post(
  '/',
  upload.single('profileImgFile'),
  asyncHandler(async (req, res) => {
    const guestIdRaw = typeof req.body?.guestId === 'string' ? req.body.guestId.trim() : '';
    if (!GUEST_ID_RE.test(guestIdRaw)) {
      throw new ApiError(422, 'INVALID_GUEST_ID');
    }

    const headerId = req.headers['x-dev-user-id'];
    if (typeof headerId !== 'string' || headerId.trim() !== guestIdRaw) {
      throw new ApiError(403, 'GUEST_AVATAR_GUEST_MISMATCH');
    }

    const file = (req as Request & { file?: { buffer: Buffer; mimetype: string } }).file;
    if (!file?.buffer?.length) {
      throw new ApiError(422, 'PROFILE_IMAGE_REQUIRED');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new ApiError(422, 'INVALID_PROFILE_IMAGE_TYPE');
    }

    const uploadDate = new Date().toISOString().slice(0, 10);
    const safeGuest = sanitizeGuestIdForFilename(guestIdRaw);
    const filename = `guest--${safeGuest}--${uploadDate}--${nanoid(10)}.jpg`;

    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'guest-avatars');
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, filename);

    try {
      await sharp(file.buffer)
        .rotate()
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toFile(filePath);
    } catch (cause) {
      logger.error({ cause, guestId: guestIdRaw }, 'Guest avatar sharp processing failed');
      throw new ApiError(422, 'AVATAR_PROCESSING_FAILED');
    }

    const publicPath = `/uploads/guest-avatars/${filename}`;

    logger.info(
      { guestId: guestIdRaw, uploadDate, filename },
      'Guest avatar uploaded',
    );

    return res.status(200).json(success({ profileImg: publicPath }));
  }),
);
