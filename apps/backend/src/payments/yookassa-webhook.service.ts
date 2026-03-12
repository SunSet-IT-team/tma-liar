import { DeckService } from '../decks/deck.service';
import type { YooKassaWebhookPayload } from './yookassa-webhook.dto';
import { logger } from '../observability/logger';

export class YooKassaWebhookService {
  constructor(private readonly deckService: DeckService = new DeckService()) {}

  public async handleNotification(payload: YooKassaWebhookPayload): Promise<void> {
    if (payload.event !== 'payment.succeeded') {
      logger.info({ event: payload.event }, 'YooKassa webhook ignored: unsupported event');
      return;
    }

    const paymentId = payload.object.id;
    const deckId = payload.object.metadata?.deckId;
    const telegramId = payload.object.metadata?.telegramId;

    if (!deckId || !telegramId) {
      logger.warn(
        { paymentId, hasDeckId: Boolean(deckId), hasTelegramId: Boolean(telegramId) },
        'YooKassa webhook ignored: metadata incomplete',
      );
      return;
    }

    await this.deckService.confirmDeckPurchase({
      deckId,
      telegramId,
      paymentId,
    });

    logger.info({ paymentId, deckId, telegramId }, 'YooKassa payment confirmed via webhook');
  }
}
