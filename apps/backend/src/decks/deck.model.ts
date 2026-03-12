import { Schema, model } from 'mongoose';
import type { Deck } from './entities/deck.entity';
import { QuestionSchema } from './question.model';

/**
 * Модель сущности "Колода"
 */
const DeckSchema = new Schema<Deck>(
  {
    name: { 
      type: String, 
      required: true
    },
    description: {
      type: String,
    },
    ageLimit: {
      type: Number,
    },
    categories: {
      type: [String],
      default: [],
    },

    questionsCount: { 
      type: Number, 
      required: true 
    },

    cover: { 
      type: String, 
      required: true 
    },

    questions: {
      type: [QuestionSchema], 
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    priceRub: {
      type: Number,
      default: 0,
    },
    purchasedBy: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true }, 
  }
);

DeckSchema.virtual('id').get(function () {
  return this._id.toString();
});

export const DeckModel = model<Deck>('Deck', DeckSchema);
