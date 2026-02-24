import z from "zod";

/**
 * Схема для валидации данных при удалении колоды
 */
export const DeleteDeckDtoSchema = z.object({
  id: z.string().min(1),
});

/**
 * DTO для deleteDeck
 * @param id айди колоды
 */
export type DeleteDeckDto = z.infer<typeof DeleteDeckDtoSchema>;
