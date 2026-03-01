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
    liarId: z.string().nullable().optional(),
    activeQuestion: z.string().nullable().optional(),
    activeQuestionText: z.string().nullable().optional(),
    winnerId: z.string().nullable().optional(),
    loserId: z.string().nullable().optional(),
    loserTask: z.string().nullable().optional(),
    players: z.array(PlayerInfoSchema.partial()).optional(),
});

export type GameStateDto = z.infer<typeof GameStateDtoSchema>;
