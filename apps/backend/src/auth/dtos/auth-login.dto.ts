import z from "zod";

/**
 * Схема для валидации данных при логине Telegram Mini App
 */
export const AuthLoginDtoSchema = z.object({
  initData: z.string().min(1),
});

/**
 * DTO для login
 * @param initData raw initData из Telegram Mini App
 */
export type AuthLoginDto = z.infer<typeof AuthLoginDtoSchema>;
