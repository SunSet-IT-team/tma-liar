import { Router } from "express";
import type { Request, Response } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserService } from "../users/user.service";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

const authRouter = Router();
const authController = new AuthController(new AuthService(new UserService()));

/**
 * Роут логина
 */
authRouter.get("/:telegramId", asyncHandler(async (req: Request, res: Response) => {
  await authController.getAuthTelegram(req, res);
}));

export default authRouter;  
