import z from "zod";
import { QuestionSchema } from "../entities/question.entity";

export const UpdateDeckDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  questionsCount: z.number().min(0).optional(),
  cover: z.string().optional(),
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
