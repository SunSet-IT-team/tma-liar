import { Schema, model } from 'mongoose';

/** Запись покупки подписки для аналитики и админки. */
export interface SubscriptionPurchase {
  id: string;
  telegramId: string;
  purchasedAt: Date;
  amountRub: number;
  /** Дата окончания доступа после этой покупки (на момент оплаты). */
  validUntil: Date;
}

const SubscriptionPurchaseSchema = new Schema<SubscriptionPurchase>(
  {
    telegramId: { type: String, required: true, index: true },
    purchasedAt: { type: Date, default: Date.now, required: true, index: true },
    amountRub: { type: Number, required: true },
    validUntil: { type: Date, required: true },
  },
  {
    timestamps: false,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

SubscriptionPurchaseSchema.virtual('id').get(function () {
  return this._id.toString();
});

export const SubscriptionPurchaseModel = model<SubscriptionPurchase>(
  'SubscriptionPurchase',
  SubscriptionPurchaseSchema,
);
