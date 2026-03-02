import type { Request, Response } from 'express';
import { ApiError, success } from '../common/response';
import { env } from '../config/env';
import { logger } from '../observability/logger';
import { YooKassaWebhookSchema } from './yookassa-webhook.dto';
import { YooKassaWebhookService } from './yookassa-webhook.service';

export class PaymentController {
  constructor(private readonly webhookService: YooKassaWebhookService = new YooKassaWebhookService()) {}

  public yookassaWebhook = async (req: Request, res: Response) => {
    const configuredToken = env.YOOKASSA_WEBHOOK_TOKEN?.trim();
    if (configuredToken) {
      const tokenFromHeader = req.headers['x-webhook-token'];
      const tokenFromQuery = req.query.token;
      const providedToken =
        (typeof tokenFromHeader === 'string' && tokenFromHeader.trim()) ||
        (typeof tokenFromQuery === 'string' && tokenFromQuery.trim()) ||
        '';

      if (providedToken !== configuredToken) {
        throw new ApiError(403, 'WEBHOOK_TOKEN_INVALID');
      }
    }

    const parsed = YooKassaWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'YooKassa webhook payload invalid');
      throw new ApiError(422, 'YOOKASSA_WEBHOOK_DATA_INVALID');
    }

    await this.webhookService.handleNotification(parsed.data);
    return res.status(200).json(success({ received: true }));
  };
}
