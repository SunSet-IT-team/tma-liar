import z from 'zod';
import type { Deck } from '../../decks/entities/deck.entity';
import { QuestionSchema } from '../../decks/entities/question.entity';
import { isValidObjectId } from 'mongoose';

/**
 * Сущность "Настройки"
 */
export interface Settings {
  deck: Deck;
  deckId: string;
  questionCount: number;
  answerTime: number;
}

/**
 * Схема валидации данных для сущности "Настройки"
 */
export const SettingsSchema = z.object({
  deck: z.object({
    name: z.string(),
    questionsCount: z.number(),
    cover: z.string(),
    questions: z.array(QuestionSchema),
  }),
  deckId: z.string(),
  questionCount: z.number(),
  answerTime: z.number(),
});