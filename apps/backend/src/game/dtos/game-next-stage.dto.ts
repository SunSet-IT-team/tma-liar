import z from "zod";
import { isValidObjectId } from "mongoose";

/**
 * Схема для DTO перехода на следующую стадию игры
 */
export const GameNextStageDtoSchema = z.object({
  gameId: z.string().nonempty().refine(val => isValidObjectId(val), {
    message: "INVALID_GAME_ID"
  }),
});

/**
 * DTO для перехода на следующую стадию игры
 * @field gameId id игры
 */
export type GameNextStageDto = z.infer<typeof GameNextStageDtoSchema>;
