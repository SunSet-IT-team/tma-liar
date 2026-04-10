import { DeckPurchaseModel, type DeckPurchasePaymentMethod } from './deck-purchase.model';

export class DeckPurchaseRepository {
  public async isPurchased(deckId: string, telegramId: string): Promise<boolean> {
    const exists = await DeckPurchaseModel.exists({ deckId, telegramId });
    return Boolean(exists);
  }

  public async markPurchased(
    deckId: string,
    telegramId: string,
    meta?: { amountRub: number; paymentMethod: DeckPurchasePaymentMethod },
  ): Promise<void> {
    await DeckPurchaseModel.updateOne(
      { deckId, telegramId },
      {
        $set: {
          purchasedAt: new Date(),
          ...(meta
            ? { amountRub: meta.amountRub, paymentMethod: meta.paymentMethod }
            : {}),
        },
      },
      { upsert: true },
    );
  }
}
