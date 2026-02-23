import z from "zod";
import { isValidObjectId } from "mongoose";

/**
 * Схема для DTO присоединения к игре
 */
export const GameJoinDtoSchema = z.object({
  gameId: z.string().nonempty().refine(val => isValidObjectId(val), {
    message: "INVALID_GAME_ID"
  }),
});

/**
 * DTO для присоединения к игре
 * @field gameId id игры
 */
export type GameJoinDto = z.infer<typeof GameJoinDtoSchema>;
