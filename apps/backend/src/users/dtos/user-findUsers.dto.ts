import z from "zod";

/**
 * Схема для валидации данных при поиске нескольких пользователей
 */
export const FindUsersDtoSchema = z.object({
  telegramIds: z.array(z.string().min(1)).min(1),
});

/**
 * DTO для findUsers
 * @param telegramIds массив telegram id пользователей
 */
export type FindUsersDto = z.infer<typeof FindUsersDtoSchema>;
