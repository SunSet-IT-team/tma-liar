import z from "zod";

/**
 * Схема для валидации данных при логине
 */
export const AuthLoginDtoSchema = z.object({
  telegramId: z.string().min(1),
});

/**
 * DTO для login
 * @param telegramId telegram id пользователя для логина
 */
export type AuthLoginDto = z.infer<typeof AuthLoginDtoSchema>;
