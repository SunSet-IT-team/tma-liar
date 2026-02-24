import { GameStages } from "../../lobby/entities/lobby.entity";
import z from "zod";
import { PlayerInfoSchema } from "./game-init.dto";
import { isValidObjectId } from "mongoose";

/**
 * DTO для передачи состояния игры
 * @field gameId   Id игры
 * @field stage    Текущая стадия игры (enum GameStages)
 * @field players  Список игроков, участвующих в игре (минимум 1)
 */
export const GameStateDtoSchema = z.object({
    gameId: z.string().nonempty().refine(val => isValidObjectId(val), {
        message: "INVALID_GAME_ID"
    }),
    stage: z.enum(GameStages).optional(),
    players: PlayerInfoSchema.partial().optional(),
});

export type GameStateDto = z.infer<typeof GameStateDtoSchema>;