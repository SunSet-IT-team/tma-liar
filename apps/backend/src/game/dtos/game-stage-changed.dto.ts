import z from "zod";
import { isValidObjectId } from "mongoose";
import { GameStages } from "../../lobby/entities/lobby.entity";
import { GameInitDtoSchema } from "./game-init.dto";

/**
 * Схема для DTO изменения стадии игры
 */
export const GameStageChangedDtoSchema = z.object({
  gameId: z.string().nonempty().refine(val => isValidObjectId(val), {
    message: "INVALID_GAME_ID"
  }),
  stage: z.enum(GameStages),
  game: GameInitDtoSchema.optional(),
});

/**
 * DTO для изменения стадии игры
 * @field gameId id игры
 * @field stage новая стадия игры
 * @field game полное состояние игры (опционально)
 */
export type GameStageChangedDto = z.infer<typeof GameStageChangedDtoSchema>;
