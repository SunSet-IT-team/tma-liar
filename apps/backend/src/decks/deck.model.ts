import { Schema, model } from 'mongoose';
import type { Deck } from './entities/deck.entity';

/**
 * Сущность "Колода"
 */
const DeckSchema = new Schema<Deck>(
  {
    name: { type: String, required: true},
    questionsCount: { type: Number, required: true },
    cover: { type: String, required: true },
    questions: { type: Number, required: true }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const DeckModel = model<Deck>('Deck', DeckSchema);
