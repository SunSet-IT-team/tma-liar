import z from "zod";

/**
 * Схема для валидации данных при удалении пользователя
 */
export const DeleteUserDtoSchema = z.object({
  telegramId: z.string().min(1),
});

/**
 * DTO для deleteUser
 * @param telegramId telegram id пользователя
 */
export type DeleteUserDto = z.infer<typeof DeleteUserDtoSchema>;
