import { QuestionSchema } from './question.entity';
import type { Question } from './question.entity';
import z from 'zod';

/**
 * Сущность "Колода"
 */
export interface Deck {
  name: string;
  questionsCount: number;
  cover: string;
  questions: Question[];
}

export const DeckSchema = z.object({
  name: z.string().max(100),
  questionsCount: z.number().min(0),
  cover: z.string(),
  questions: z.array(QuestionSchema),
});
