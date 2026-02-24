import { Router } from "express";
import { LobbyController } from "./lobby.controller";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import type { Request, Response } from "express";

/** Маршруты для работы с лобби */

export const lobbyRouter = Router();
const lobbyController = new LobbyController();

/** Маршрут для получения одного лобби */
lobbyRouter.get('/:lobbyCode', asyncHandler(async (req: Request, res: Response) => {
  await lobbyController.findLobby(req, res);
}));

/** Маршрут для получения нескольких колод*/
lobbyRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  await lobbyController.findLobbies(req, res);
}));

/** Маршрут для создания колоды*/
lobbyRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  await lobbyController.createLobby(req, res);
}));

/** Маршрут для обновления лобби */
lobbyRouter.put('/', asyncHandler(async (req: Request, res: Response) => {
  await lobbyController.updateLobby(req, res);
}));

/** Маршрут для удаления лобби */
lobbyRouter.delete('/:lobbyCode', asyncHandler(async (req: Request, res: Response) => {
  await lobbyController.deleteLobby(req, res);
}));
