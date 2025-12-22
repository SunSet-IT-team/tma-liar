import { Router } from 'express';
import type { Request, Response } from 'express';
import { UserAuth } from './auth.service';
import { UserApi } from '../users/user.service';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { ApiError, success } from '../common/response';

export const authController = Router();

const userAuth = new UserAuth(new UserApi());

authController.get('/:telegramId', asyncHandler(async (req: Request, res: Response) => {
    const { telegramId } = req.params; 
    
    if(!telegramId) throw new ApiError(400, "USER_ID_NOT_SET");

    const token = await userAuth.userLogin({ telegramId });

    if (!token) {
      throw new ApiError(401, "AUTH_FAILED");
    }

    return res.status(200).json(success({ token }));
}));