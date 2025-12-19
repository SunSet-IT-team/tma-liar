import { Router } from 'express';
import type { Request, Response } from 'express';
import { UserApi } from './user.service';
import { ApiError, success } from '../common/response';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';

export const userController = Router();
const userApi = new UserApi();

userController.get('/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId } = req.params; 

  if(!telegramId) throw new ApiError(404, "USER_ID_NOT_SET");

  const user = await userApi.findUser({ telegramId });

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND");
  }

  return res.status(200).json(success(user));
}));

userController.get('/', asyncHandler(async (req: Request, res: Response) => {
  const telegramIds = req.query.telegramIds;

  if (!telegramIds) {
    throw new ApiError(400, "USER_IDS_NOT_SET");
  }

  const ids: string[] = Array.isArray(telegramIds)
    ? telegramIds.map(id => String(id))
    : String(telegramIds).split(',');

  const users = await userApi.findUsers({ telegramIds: ids });

  return res.status(200).json(success(users));
}));


userController.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, nickname, ...param } = req.body; 

  const user = await userApi.createUser({ telegramId, nickname, ...param });

  return res.status(200).json(success(user));
}));

userController.put('/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { nickname, profileImg, passwordHash } = req.body;

  if(!telegramId) throw new ApiError(404, "USER_ID_NOT_SET");

  const updatedUser = await userApi.updateUser({
    telegramId,
    nickname,
    profileImg,
    passwordHash,
  });

  return res.status(200).json(success(updatedUser));
}));

userController.delete('/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId } = req.params;

  if (!telegramId) {
    throw new ApiError(400, "USER_ID_NOT_SET");
  }

  const deletedUser = await userApi.deleteUser({ telegramId });

  return res.status(200).json(success(deletedUser));
}));
