import z from "zod";

/**
 * Схема для валидации данных при поиске пользователя
 */
export const FindUserDtoSchema = z.object({
  telegramId: z.string().min(1),
});

/**
 * DTO для findUser
 * @param telegramId telegram id пользователя
 */
export type FindUserDto = z.infer<typeof FindUserDtoSchema>;
