import { Router } from 'express';
import { DeckController } from './deck.controller';
import { DeckService } from './deck.service';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import type { Request, Response } from 'express';
import { adminTokenMiddleware } from '../middlewares/adminToken.middleware';
import multer from 'multer';

export const deckAdminRouter = Router();
const deckController = new DeckController(new DeckService());
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

deckAdminRouter.use(adminTokenMiddleware);

deckAdminRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  await deckController.findDeckAdmin(req, res);
}));

deckAdminRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  await deckController.findDecksAdmin(req, res);
}));

deckAdminRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  await deckController.createDeck(req, res);
}));

deckAdminRouter.put('/', asyncHandler(async (req: Request, res: Response) => {
  await deckController.updateDeck(req, res);
}));

deckAdminRouter.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await deckController.deleteDeck(req, res);
}));

deckAdminRouter.post('/upload-cover', upload.single('coverFile'), asyncHandler(async (req: Request, res: Response) => {
  await deckController.uploadCoverAdmin(req, res);
}));
