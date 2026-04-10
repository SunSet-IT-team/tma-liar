import z from "zod";

/**
 * Схема для валидации данных при создании пользователя
 */
export const CreateUserDtoSchema = z.object({
  telegramId: z.string().min(1),
  nickname: z.string().min(1),
  profileImg: z.string().optional(),
  passwordHash: z.string().optional(),
  balanceRub: z.number().nonnegative().optional(),
});

/**
 * DTO для createUser
 * @param telegramId telegram id пользователя
 * @param nickname никнейм
 * @param profileImg ссылка на аватар (опционально)
 * @param passwordHash хэш пароля (опционально)
 */
export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
