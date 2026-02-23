import z from "zod";
import { isValidObjectId } from "mongoose";

/**
 * Схема для DTO поиска игры
 */
export const GameFindDtoSchema = z.object({
  gameId: z.string().nonempty().refine(val => isValidObjectId(val), {
    message: "INVALID_GAME_ID"
  }),
});

/**
 * DTO для поиска игры
 * @field gameId id игры
 */
export type GameFindDto = z.infer<typeof GameFindDtoSchema>;
