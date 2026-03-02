import z from "zod";
import { QuestionSchema } from "../entities/question.entity";

export const UpdateDeckDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  ageLimit: z.number().int().min(0).optional(),
  categories: z.array(z.string().min(1)).optional(),
  questionsCount: z.number().min(0).optional(),
  cover: z.string().min(1).regex(/^\/uploads\/decks\/.+/, 'COVER_MUST_BE_FILE_PATH').optional(),
  isPaid: z.boolean().optional(),
  priceRub: z.number().min(0).optional(),
  questions: z.array(QuestionSchema).optional(),
});

/**
 * DTO для updateDeck
 * @param id id колоды
 * @param name имя колоды
 * @param questionsCount количество вопросов в колоде
 * @param cover обложка колоды
 * @param questions массив заданных вопросов
 */
export type UpdateDeckDto = z.infer<typeof UpdateDeckDtoSchema>;
