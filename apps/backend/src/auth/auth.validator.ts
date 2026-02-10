import { ApiError } from "../common/response";
import z from "zod";

/**
 * Схема для валидации данных при логине
 */

const AuthLoginDtoSchema = z.object({
    telegramId: z.string().nonempty()
});

/**
 * Валидатор для telegramId AuthLoginDto
 * @param telegramId telegram айди пользователя
 * @returns проверенный айди 
 */
export function validateLoginTelegramId(telegramId: unknown): string {
    const result = AuthLoginDtoSchema.safeParse({ telegramId });
    if (!result.success) {
        throw new ApiError(400, "USER_ID_NOT_SET");
    }
    
    return result.data.telegramId;
}