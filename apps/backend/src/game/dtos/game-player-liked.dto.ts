import z from "zod";
import { isValidObjectId } from "mongoose";

/**
 * Схема для DTO лайка ответа игрока
 */
export const GamePlayerLikedDtoSchema = z.object({
  gameId: z.string().nonempty().refine(val => isValidObjectId(val), {
    message: "INVALID_GAME_ID"
  }),
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
});

/**
 * DTO для лайка ответа игрока
 * @field gameId id игры
 * @field senderId id игрока, который ставит лайк
 * @field receiverId id игрока, чей ответ лайкают
 */
export type GamePlayerLikedDto = z.infer<typeof GamePlayerLikedDtoSchema>;
