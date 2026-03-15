import { Router } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import type { Request, Response } from "express";
import multer from 'multer';

export const userRouter = Router();
const userController = new UserController(new UserService());
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

/** Маршруты для работы с пользователями */

/** Текущий пользователь по auth (JWT или x-dev-user-id). Для гостей — 404. */
userRouter.get('/me', asyncHandler(async (req: Request, res: Response) => {
  await userController.getMe(req, res);
}));

/** Маршрут для получения нескольких пользователей (query: telegramIds — строка через запятую или массив) */
userRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  await userController.findUsers(req, res);
}));

/** Маршрут для получения одного пользователя */
userRouter.get('/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  await userController.findUser(req, res);
}));

/** Маршрут для создания пользователя */
userRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  await userController.createUser(req, res);
}));

/** Маршрут для обновления пользователя */
userRouter.put('/:telegramId', upload.single('profileImgFile'), asyncHandler(async (req: Request, res: Response) => {
  await userController.updateUser(req, res);
}));

/** Маршрут для удаления пользователя */
userRouter.delete('/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  await userController.deleteUser(req, res);
}));
