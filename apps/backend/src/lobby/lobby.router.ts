import { Router } from "express";
import { LobbyController } from "./lobby.controller";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import type { Request, Response } from "express";

/** Маршруты для работы с лобби */

export const lobbyRouter = Router();
const lobbyController = new LobbyController();

/** Маршрут для получения одного лобби */
lobbyRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
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

/** Маршрут для обновления колоды*/
lobbyRouter.put('/', asyncHandler(async (req: Request, res: Response) => {
  await lobbyController.updateLobby(req, res);
}));

/** Маршрут для удаления колоды*/
lobbyRouter.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await lobbyController.deleteLobby(req, res);
}));
