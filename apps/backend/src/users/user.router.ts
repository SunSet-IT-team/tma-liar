import { Router } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import type { Request, Response } from "express";

export const userRouter = Router();
const userController = new UserController(new UserService());

/** Маршруты для работы с пользователями */

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
userRouter.put('/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  await userController.updateUser(req, res);
}));

/** Маршрут для удаления пользователя */
userRouter.delete('/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  await userController.deleteUser(req, res);
}));
