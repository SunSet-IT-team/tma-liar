import z from "zod";
import { QuestionSchema } from "../entities/question.entity";

export const CreateDeckDtoSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  ageLimit: z.number().int().min(0).optional(),
  categories: z.array(z.string().min(1)).optional(),
  questionsCount: z.number().min(0),
  cover: z.string().min(1).regex(/^\/uploads\/decks\/.+/, 'COVER_MUST_BE_FILE_PATH'),
  isPaid: z.boolean().optional(),
  priceRub: z.number().min(0).optional(),
  questions: z.array(QuestionSchema),
});

/**
 * DTO для createDeck
 * @param name имя колоды
 * @param questionsCount количество вопросов в колоде
 * @param cover обложка колоды
 * @param questions массив заданных вопросов
 */
export type CreateDeckDto = z.infer<typeof CreateDeckDtoSchema>;
