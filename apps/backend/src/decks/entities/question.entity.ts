import z from "zod";

/**
 * Сущность "Вопрос"
 */
export interface Question {
  id: string;
  type: string;
  content: string;
  complexity: number;
}

export const QuestionSchema = z.object({
  id: z.string().max(100),
  type: z.string().max(100),
  content: z.string().max(1000),
  complexity: z.number(),
});
