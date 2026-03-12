import { QuestionSchema } from './question.entity';
import type { Question } from './question.entity';
import z from 'zod';

/**
 * Сущность "Колода"
 */
export interface Deck {
  id: string;
  name: string;
  description?: string;
  ageLimit?: number;
  categories?: string[];
  questionsCount: number;
  cover: string;
  isPaid?: boolean;
  priceRub?: number;
  purchasedBy?: string[];
  isPurchased?: boolean;
  isLocked?: boolean;
  questions: Question[];
}

export const DeckSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(100),
  description: z.string().max(2000).optional(),
  ageLimit: z.number().int().min(0).optional(),
  categories: z.array(z.string().min(1)).optional(),
  questionsCount: z.number().min(0),
  cover: z.string(),
  isPaid: z.boolean().optional(),
  priceRub: z.number().min(0).optional(),
  purchasedBy: z.array(z.string().min(1)).optional(),
  isPurchased: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  questions: z.array(QuestionSchema),
});
