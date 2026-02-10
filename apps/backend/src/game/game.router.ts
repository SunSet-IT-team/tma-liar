import { Router } from "express";
import { GameController } from "./game.controller";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import type { Request, Response } from "express";

export const gameRouter = Router();
const gameController = new GameController();

/** Маршруты для работы с игрой */

// Старт игры
gameRouter.post('/start', asyncHandler(async (req: Request, res: Response) => {
  await gameController.startGame(req, res);
}));

// Переход к следующей стадии
gameRouter.post('/:gameId/next-stage', asyncHandler(async (req: Request, res: Response) => {
  await gameController.nextStage(req, res);
}));

// Выбор лжецом (врать / не врать)
gameRouter.post('/liar-chooses', asyncHandler(async (req: Request, res: Response) => {
  await gameController.liarChooses(req, res);
}));

// Установка ответа игрока
gameRouter.post('/set-answer', asyncHandler(async (req: Request, res: Response) => {
  await gameController.setAnswer(req, res);
}));

// Подтверждение ответа игрока
gameRouter.post('/confirm-answer', asyncHandler(async (req: Request, res: Response) => {
  await gameController.confirmAnswer(req, res);
}));

// Лайк ответа игрока
gameRouter.post('/like-answer', asyncHandler(async (req: Request, res: Response) => {
  await gameController.likeAnswer(req, res);
}));
