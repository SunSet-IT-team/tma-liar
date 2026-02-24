import { Router } from "express";
import type { Request, Response } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

const authRouter = Router();
const authController = new AuthController(new AuthService());

/**
 * Роут логина через Telegram Mini App
 */
authRouter.post('/tma', asyncHandler(async (req: Request, res: Response) => {
  await authController.loginWithTma(req, res);
}));

export default authRouter;  
