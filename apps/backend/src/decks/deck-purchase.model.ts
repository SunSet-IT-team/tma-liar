import { Schema, model } from 'mongoose';

export interface DeckPurchase {
  id: string;
  deckId: string;
  telegramId: string;
  purchasedAt: Date;
}

const DeckPurchaseSchema = new Schema<DeckPurchase>(
  {
    deckId: { type: String, required: true, index: true },
    telegramId: { type: String, required: true, index: true },
    purchasedAt: { type: Date, default: Date.now, required: true },
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
