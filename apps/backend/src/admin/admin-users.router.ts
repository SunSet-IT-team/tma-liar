import { Router } from 'express';
import { adminTokenMiddleware } from '../middlewares/adminToken.middleware';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { UserModel } from '../users/user.model';
import { ApiError, success } from '../common/response';
import type { Request, Response } from 'express';

export const adminUsersRouter = Router();

adminUsersRouter.use(adminTokenMiddleware);

adminUsersRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await UserModel.find().lean();
    const mapped = users.map((u) => ({
      ...u,
      id: u._id?.toString(),
    }));
    return res.status(200).json(success(mapped));
  }),
);

adminUsersRouter.get(
  '/:telegramId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await UserModel.findOne({
      telegramId: req.params.telegramId,
    }).lean();
    if (!user) throw new ApiError(404, 'USER_NOT_FOUND');
    return res.status(200).json(success({ ...user, id: user._id?.toString() }));
  }),
);

adminUsersRouter.put(
  '/:telegramId',
  asyncHandler(async (req: Request, res: Response) => {
    const { telegramId } = req.params;
    const body = req.body as Record<string, unknown>;
    const allowedFields: Record<string, unknown> = {};
    if (typeof body.nickname === 'string') allowedFields.nickname = body.nickname;
    if (typeof body.profileImg === 'string') allowedFields.profileImg = body.profileImg;

    const updated = await UserModel.findOneAndUpdate(
      { telegramId },
      { $set: allowedFields },
      { new: true },
    ).lean();

    if (!updated) throw new ApiError(404, 'USER_NOT_FOUND');
    return res
      .status(200)
      .json(success({ ...updated, id: updated._id?.toString() }));
  }),
);

adminUsersRouter.delete(
  '/:telegramId',
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await UserModel.findOneAndDelete({
      telegramId: req.params.telegramId,
    }).lean();
    if (!deleted) throw new ApiError(404, 'USER_NOT_FOUND');
    return res
      .status(200)
      .json(success({ ...deleted, id: deleted._id?.toString() }));
  }),
);
