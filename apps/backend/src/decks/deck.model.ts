import { Schema, model } from 'mongoose';
import type { Deck } from './entities/deck.entity';
import { QuestionModel } from './question.model';
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const DeckModel = model<Deck>('Deck', DeckSchema);
