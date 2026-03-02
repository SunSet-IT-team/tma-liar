import { Schema } from "mongoose"
import { DeckSchema } from "../decks/entities/deck.entity";

/**Схема сущности настроекы */
export const SettingsModel = new Schema({
  deck: { 
    type: DeckSchema,
    required: true,
  }, 

  deckId: { 
    type: String,
    required: true,
  },

  questionCount: {
    type: Number,
    required: true,
  },

  answerTime: {
    type: Number,
  required: true,
  },
});
