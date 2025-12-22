import { Router } from 'express';
import type { Request, Response } from 'express';
import { LobbyApi } from './lobby.service';
import { ApiError, success } from '../common/response';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';

export const lobbyController = Router();
const lobbyApi = new LobbyApi();

lobbyController.get('/:lobbyCode', asyncHandler(async (req: Request, res: Response) => {
  const { lobbyCode } = req.params;

  if (!lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');

  const lobby = await lobbyApi.findLobby({ lobbyCode });

  if (!lobby) throw new ApiError(404, 'LOBBY_NOT_EXIST');

  return res.status(200).json(success(lobby));
}));

lobbyController.get('/', asyncHandler(async (req: Request, res: Response) => {
  const lobbyCodes = req.query.lobbyCodes;

  if (!lobbyCodes) throw new ApiError(400, 'LOBBY_CODES_NOT_SET');

  const codes: string[] = Array.isArray(lobbyCodes)
    ? lobbyCodes.map(c => String(c))
    : String(lobbyCodes).split(',');

  const lobbies = await lobbyApi.findLobbies({ lobbyCodes: codes });

  return res.status(200).json(success(lobbies));
}));

lobbyController.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { adminId, players, settings } = req.body;

  const lobby = await lobbyApi.createLobby({
    adminId,
    players,
    settings,
  });

  return res.status(201).json(success(lobby));
}));

lobbyController.put('/:lobbyCode', asyncHandler(async (req: Request, res: Response) => {
  const { lobbyCode } = req.params;
  const updateFields = req.body;

  if (!lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');

  const updatedLobby = await lobbyApi.updateLobby({
    lobbyCode,
    ...updateFields,
  });

  return res.status(200).json(success(updatedLobby));
}));

lobbyController.delete('/:lobbyCode', asyncHandler(async (req: Request, res: Response) => {
  const { lobbyCode } = req.params;

  if (!lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');

  const deletedLobby = await lobbyApi.deleteLobby({ lobbyCode });

  return res.status(200).json(success(deletedLobby));
}));

lobbyController.post('/:lobbyCode/join', asyncHandler(async (req: Request, res: Response) => {
  const { lobbyCode } = req.params;
  const player = req.body; 

  if (!lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');
  if (!player || !player.telegramId) throw new ApiError(400, 'PLAYER_NOT_SET');

  const updatedLobby = await lobbyApi.joinLobby(lobbyCode, player);

  return res.status(200).json(success(updatedLobby));
}));
