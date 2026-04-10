import type { Request, Response } from 'express';
import { DeckService } from './deck.service';
import { ApiError, success } from '../common/response';
import { FindDeckDtoSchema, type FindDeckDto } from './dtos/deck-find.dto';
import { CreateDeckDtoSchema, type CreateDeckDto } from './dtos/deck-create.dto';
import { UpdateDeckDtoSchema, type UpdateDeckDto } from './dtos/deck-update.dto';
import { DeleteDeckDtoSchema, type DeleteDeckDto } from './dtos/deck-delete.dto';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { UserService } from '../users/user.service';
import z from 'zod';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { logger } from '../observability/logger';
import sharp from 'sharp';

const DeckPurchaseSchema = z.object({
  paymentId: z.string().min(1).optional(),
});

type DeckCoverUploadRequest = Request & {
  file?: {
    mimetype: string;
    buffer: Buffer;
  };
};

function resolveDeckCoverExtension(mimeType: string): string {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/gif') return '.gif';
  if (mimeType === 'image/svg+xml') return '.svg';
  return '.bin';
}

/**
 * Класс контроллеров колод
 */
export class DeckController {
  constructor(
    private deckService: DeckService,
    private readonly userService: UserService = new UserService(),
  ) {}

  private async resolveTelegramId(req: Request): Promise<string> {
    const authReq = req as AuthRequest;
    if (!authReq.userId) {
      throw new ApiError(401, 'UNAUTHORIZED');
    }

    const user = await this.userService.findUserByAuthId({ authUserId: authReq.userId });
    return user.telegramId;
  }

  /**
   * Контроллер поиска колоды
   */
  findDeckAdmin = async (req: Request, res: Response) => {
    const result = FindDeckDtoSchema.safeParse({ id: req.params.id });

    if (!result.success) {
      throw new ApiError(422, "FIND_DECK_DATA_INVALID");
    }

    const dto: FindDeckDto = result.data;
    const deck = await this.deckService.findDeckRaw({ id: dto.id });

    return res.status(200).json(success(deck));
  };

  /**
   * Контроллер поиска нескольких колод (admin)
   */
  findDecksAdmin = async (_req: Request, res: Response) => {
    const decks = await this.deckService.findDecksRaw();
    return res.status(200).json(success(decks));
  };

  /**
   * Контроллер поиска колоды
   */
  findDeck = async (req: Request, res: Response) => {
    const result = FindDeckDtoSchema.safeParse({ id: req.params.id });

    if (!result.success) {
      throw new ApiError(422, "FIND_DECK_DATA_INVALID");
    }

    const dto: FindDeckDto = result.data;
    const telegramId = await this.resolveTelegramId(req);
    const deck = await this.deckService.findDeck({ id: dto.id }, telegramId);

    return res.status(200).json(success(deck));
  };

  /**
   * Контроллер поиска нескольких колод
   */
  findDecks = async (req: Request, res: Response) => {
    const telegramId = await this.resolveTelegramId(req);
    const decks = await this.deckService.findDecks(telegramId);

    return res.status(200).json(success(decks));
  };

  /**
   * Контроллер создания колоды
   */
  createDeck = async (req: Request, res: Response) => {
    const result = CreateDeckDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(422, "CREATE_DECK_DATA_INVALID");
    }

    const dto: CreateDeckDto = result.data;
    const deck = await this.deckService.createDeck({ ...dto });

    return res.status(200).json(success(deck));
  };

  /**
   * Контроллер обновления колоды
   */
  updateDeck = async (req: Request, res: Response) => {
    const result = UpdateDeckDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(422, "UPDATE_DECK_DATA_INVALID");
    }

    const dto: UpdateDeckDto = result.data;
    const deck = await this.deckService.updateDeck({ ...dto });

    return res.status(200).json(success(deck));
  };

  /**
   * Контроллер удаления колоды
   */
  deleteDeck = async (req: Request, res: Response) => {
    const result = DeleteDeckDtoSchema.safeParse({ id: req.params.id });

    if (!result.success) {
      throw new ApiError(422, "DELETE_DECK_DATA_INVALID");
    }

    const dto: DeleteDeckDto = result.data;
    const deck = await this.deckService.deleteDeck({ id: dto.id });

    return res.status(200).json(success(deck));
  };

  createPurchase = async (req: Request, res: Response) => {
    const deckResult = FindDeckDtoSchema.safeParse({ id: req.params.id });
    if (!deckResult.success) {
      throw new ApiError(422, 'DECK_PURCHASE_DATA_INVALID');
    }

    const telegramId = await this.resolveTelegramId(req);
    const result = await this.deckService.createDeckPurchase({
      deckId: deckResult.data.id,
      telegramId,
    });

    return res.status(200).json(success(result));
  };

  purchaseWithBalance = async (req: Request, res: Response) => {
    const deckResult = FindDeckDtoSchema.safeParse({ id: req.params.id });
    if (!deckResult.success) {
      throw new ApiError(422, 'DECK_PURCHASE_DATA_INVALID');
    }

    const telegramId = await this.resolveTelegramId(req);
    const result = await this.deckService.purchaseDeckWithBalance({
      deckId: deckResult.data.id,
      telegramId,
    });

    return res.status(200).json(success(result));
  };

  confirmPurchase = async (req: Request, res: Response) => {
    const deckResult = FindDeckDtoSchema.safeParse({ id: req.params.id });
    const paymentResult = DeckPurchaseSchema.safeParse(req.body);
    if (!deckResult.success || !paymentResult.success || !paymentResult.data.paymentId) {
      throw new ApiError(422, 'DECK_PURCHASE_CONFIRM_DATA_INVALID');
    }

    const telegramId = await this.resolveTelegramId(req);
    const result = await this.deckService.confirmDeckPurchase({
      deckId: deckResult.data.id,
      paymentId: paymentResult.data.paymentId,
      telegramId,
    });

    return res.status(200).json(success(result));
  };

  uploadCoverAdmin = async (req: Request, res: Response) => {
    const uploadReq = req as DeckCoverUploadRequest;

    if (!uploadReq.file) {
      throw new ApiError(422, 'DECK_COVER_FILE_REQUIRED');
    }

    if (!uploadReq.file.mimetype.startsWith('image/')) {
      throw new ApiError(422, 'INVALID_DECK_COVER_TYPE');
    }

    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'decks');
    await mkdir(uploadsDir, { recursive: true });

    const extension = resolveDeckCoverExtension(uploadReq.file.mimetype);
    const fileBaseName = `${Date.now()}-${randomUUID()}`;
    const filename = `${fileBaseName}${extension}`;
    const filePath = path.join(uploadsDir, filename);

    let finalBuffer = uploadReq.file.buffer;
    let finalFileName = filename;
    let finalMimeType = uploadReq.file.mimetype;

    try {
      // Нормализуем изображение для мобильных webview:
      // 1) учитываем EXIF-ориентацию
      // 2) ограничиваем размер
      // 3) сжимаем и убираем лишние метаданные
      finalBuffer = await sharp(uploadReq.file.buffer)
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      finalFileName = `${fileBaseName}.jpg`;
      finalMimeType = 'image/jpeg';
    } catch (error) {
      logger.warn(
        { error, mimeType: uploadReq.file.mimetype },
        'Failed to optimize deck cover image, using original file',
      );
    }

    await writeFile(path.join(uploadsDir, finalFileName), finalBuffer);
    const coverPath = `/uploads/decks/${finalFileName}`;
    logger.info(
      {
        mimeType: finalMimeType,
        sizeOriginal: uploadReq.file.buffer.length,
        sizeFinal: finalBuffer.length,
        coverPath,
      },
      'Deck cover uploaded',
    );

    return res.status(200).json(success({ cover: coverPath }));
  };
}
