import { Router } from "express";
import { Game } from "./game.service";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import type { Request, Response } from "express";
import { ApiError, success } from "../common/response";

export const gameController = Router(); 
const game = new Game(); 

/**
 * Роут для тригерра следующего шага
 */
gameController.post('/:lobbyCode', asyncHandler(async (req: Request, res: Response) => {
    const { lobbyCode } = req.params;

    if (!lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');
    
    const response = await game.nextStage({ lobbyCode: lobbyCode });

    return res.status(200).json(success(response));
}))

/**
 * Роут чтобы выбрать, будет ли врать лжец
 */
gameController.post('/:lobbyCode/liar', asyncHandler(async (req: Request, res: Response) => {
    const { lobbyCode } = req.params;
    const { answer } = req.body;

    if (!lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');

    const response = await game.liarChooses(lobbyCode, answer);

    return res.status(200).json(success(response));
}));

/**
 * Роут чтобы поставить лайк
 */
gameController.post('/:lobbyCode/like', asyncHandler(async (req: Request, res: Response) => {
    const { lobbyCode } = req.params;
    const { senderId, receiverId } = req.body;

    if (!lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');

    const response = await game.likeAnswer({ senderId, receiverId, lobbyCode });

    return res.status(200).json(success(response));
}));

/**
 * Роут чтобы задать ответ 
 */
gameController.put('/:lobbyCode/answer', asyncHandler(async (req: Request, res: Response) => {
    const { lobbyCode } = req.params;
    const { telegramId, answer } = req.body;

    if (!lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');

    const response = await game.setAnswer({ lobbyCode, telegramId, answer });

    return res.status(200).json(success(response));
}));

/**
 * Роут чтобы зафиксировать ответ
 */
gameController.put('/:lobbyCode/secure', asyncHandler(async (req: Request, res: Response) => {
    const { lobbyCode } = req.params;
    const { telegramId } = req.body;

    if (!lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');

    const response = await game.secureAnswer(lobbyCode, telegramId);

    return res.status(200).json(success(response));
}));