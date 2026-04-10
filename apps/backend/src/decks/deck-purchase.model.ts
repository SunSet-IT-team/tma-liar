import { Schema, model } from 'mongoose';

export type DeckPurchasePaymentMethod = 'yookassa' | 'balance';

export interface DeckPurchase {
  id: string;
  deckId: string;
  telegramId: string;
  purchasedAt: Date;
  /** Фактически уплаченная сумма (для аналитики). */
  amountRub?: number;
  paymentMethod?: DeckPurchasePaymentMethod;
}

const DeckPurchaseSchema = new Schema<DeckPurchase>(
  {
    deckId: { type: String, required: true, index: true },
    telegramId: { type: String, required: true, index: true },
    purchasedAt: { type: Date, default: Date.now, required: true },
    amountRub: { type: Number },
    paymentMethod: { type: String, enum: ['yookassa', 'balance'] },
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

DeckPurchaseSchema.index({ deckId: 1, telegramId: 1 }, { unique: true });

DeckPurchaseSchema.virtual('id').get(function () {
  return this._id.toString();
});

export const DeckPurchaseModel = model<DeckPurchase>('DeckPurchase', DeckPurchaseSchema);
