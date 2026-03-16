import { Router } from 'express';
import { adminTokenMiddleware } from '../middlewares/adminToken.middleware';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { LobbyController } from '../lobby/lobby.controller';
import type { Request, Response } from 'express';

export const adminLobbiesRouter = Router();
const lobbyController = new LobbyController();

adminLobbiesRouter.use(adminTokenMiddleware);

adminLobbiesRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    await lobbyController.findLobbies(req, res);
  }),
);

adminLobbiesRouter.get(
  '/:lobbyCode',
  asyncHandler(async (req: Request, res: Response) => {
    await lobbyController.findLobby(req, res);
  }),
);

adminLobbiesRouter.put(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    await lobbyController.updateLobby(req, res);
  }),
);

adminLobbiesRouter.delete(
  '/:lobbyCode',
  asyncHandler(async (req: Request, res: Response) => {
    await lobbyController.deleteLobby(req, res);
  }),
);
