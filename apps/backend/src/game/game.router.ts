import { Router } from "express";
import type { Server } from "socket.io";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import type { Request, Response } from "express";

/**
 * Класс роутера игры
 */
export function createGameRouter(io: Server) {
  const router = Router();
  const gameController = new GameController(new GameService(io));

  /** Маршруты для работы с игрой */

  /** Переход к следующей стадии */
  router.post('/:gameId/next-stage', asyncHandler(async (req: Request, res: Response) => {
    await gameController.nextStage(req, res);
  }));

  /** Выбор лжецом (врать / не врать) */
  router.post('/liar-chooses', asyncHandler(async (req: Request, res: Response) => {
    await gameController.liarChooses(req, res);
  }));

  /** Установка ответа игрока */
  router.post('/set-answer', asyncHandler(async (req: Request, res: Response) => {
    await gameController.setAnswer(req, res);
  }));

  /** Подтверждение ответа игрока */
  router.post('/confirm-answer', asyncHandler(async (req: Request, res: Response) => {
    await gameController.confirmAnswer(req, res);
  }));

  /** Лайк ответа игрока */
  router.post('/like-answer', asyncHandler(async (req: Request, res: Response) => {
    await gameController.likeAnswer(req, res);
  }));

  return router;
}
