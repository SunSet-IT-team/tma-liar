import { Router } from "express";
import { AuthController } from "./auth.controller";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

const authRouter = Router();
const authController = new AuthController();

/**
 * Роут логина
 */
authRouter.get('/:telegramId', asyncHandler(async (req, res) => {
    await authController.getAuthTelegram(req, res); 
}));

export default authRouter;  
