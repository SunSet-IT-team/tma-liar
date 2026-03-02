import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { PaymentController } from './payment.controller';
import type { Request, Response } from 'express';

export const paymentRouter = Router();
const paymentController = new PaymentController();

paymentRouter.post(
  '/yookassa/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    await paymentController.yookassaWebhook(req, res);
  }),
);
