import z from "zod";
import { isValidObjectId } from "mongoose";

/**
 * Схема для DTO подтверждения ответа игрока
 */
export const GamePlayerSecuredDtoSchema = z.object({
  gameId: z.string().nonempty().refine(val => isValidObjectId(val), {
    message: "INVALID_GAME_ID"
  }),
  playerId: z.string().min(1),
});

/**
 * DTO для подтверждения ответа игрока
 * @field gameId id игры
 * @field playerId id игрока, который подтверждает ответ
 */
export type GamePlayerSecuredDto = z.infer<typeof GamePlayerSecuredDtoSchema>;
