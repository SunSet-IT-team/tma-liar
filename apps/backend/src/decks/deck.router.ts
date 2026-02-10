import { Router } from "express";
import { DeckController } from "./deck.controller";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import type { Request, Response } from "express";

export const deckRouter = Router();
const deckController = new DeckController();

/** Маршруты для работы с колодами */

/** Маршрут для получения одной колоды*/
deckRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  await deckController.findDeck(req, res);
}));

/** Маршрут для получения нескольких колод*/
deckRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  await deckController.findDecks(req, res);
}));

/** Маршрут для создания колоды*/
deckRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  await deckController.createDeck(req, res);
}));

/** Маршрут для обновления колоды*/
deckRouter.put('/', asyncHandler(async (req: Request, res: Response) => {
  await deckController.updateDeck(req, res);
}));

/** Маршрут для удаления колоды*/
deckRouter.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await deckController.deleteDeck(req, res);
}));
