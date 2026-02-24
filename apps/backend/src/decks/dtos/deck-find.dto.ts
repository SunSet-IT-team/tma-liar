import z from "zod";

/**
 * Схема для валидации данных при поиске колоды
 */
export const FindDeckDtoSchema = z.object({
  id: z.string().min(1),
});

/**
 * DTO для findDeck
 * @param id айди колоды
 */
export type FindDeckDto = z.infer<typeof FindDeckDtoSchema>;
