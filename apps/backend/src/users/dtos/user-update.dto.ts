import z from "zod";

/**
 * Схема для валидации данных при обновлении пользователя
 */
export const UpdateUserDtoSchema = z.object({
  telegramId: z.string().min(1),
  nickname: z.string().min(1).optional(),
  profileImg: z.string().optional(),
  passwordHash: z.string().optional(),
}).refine(
  (data) => data.nickname !== undefined || data.profileImg !== undefined || data.passwordHash !== undefined,
  { message: "UPDATE_FIELDS_EMPTY" }
);

/**
 * DTO для updateUser
 * @param telegramId telegram id пользователя
 * @param nickname никнейм (опционально)
 * @param profileImg ссылка на аватар (опционально)
 * @param passwordHash хэш пароля (опционально)
 */
export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;
