import z from "zod";
import { QuestionSchema } from "../entities/question.entity";

export const CreateDeckDtoSchema = z.object({
  name: z.string().min(1).max(100),
  questionsCount: z.number().min(0),
  cover: z.string(),
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
