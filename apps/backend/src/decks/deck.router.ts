import { Router } from "express";
import { DeckController } from "./deck.controller";
import { DeckService } from "./deck.service";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import type { Request, Response } from "express";

export const deckRouter = Router();
const deckController = new DeckController(new DeckService());

/** Маршруты для работы с колодами */

/** Маршрут для получения одной колоды*/
deckRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  await deckController.findDeck(req, res);
}));

/** Маршрут для получения нескольких колод*/
deckRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  await deckController.findDecks(req, res);
}));

/** Маршрут создания платежа за платную колоду */
deckRouter.post('/:id/purchase', asyncHandler(async (req: Request, res: Response) => {
  await deckController.createPurchase(req, res);
}));

/** Маршрут подтверждения покупки платной колоды */
deckRouter.post('/:id/purchase/confirm', asyncHandler(async (req: Request, res: Response) => {
  await deckController.confirmPurchase(req, res);
}));
