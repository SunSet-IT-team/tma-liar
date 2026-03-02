import z from "zod";
import { isValidObjectId } from "mongoose";
import { GameStages } from "../../lobby/entities/lobby.entity";

/**
 * Схема для передачи информации об игроке на клиент.
 * Используется в DTO старта игры и обновлений состояния.
 * @field nickname     Ник игрока (не может быть пустым)
 * @field profileImg   Ссылка на аватар игрока
 */
export const PlayerInfoSchema = z.object({
    id: z.string().min(1),
    nickname: z.string().min(1),
    profileImg: z.string().optional().default(''),
    isReady: z.boolean().optional().default(false),
    inGame: z.boolean().optional(),
    loserTask: z.string().nullable().optional().default(null),
})


export const GameInitDtoSchema = z.object({
    gameId: z.string().nonempty().refine(val => isValidObjectId(val), {
        message: "INVALID_GAME_ID"
    }),
    stage: z.enum(GameStages), 
    players: z.array(PlayerInfoSchema).min(1),     
});

/**
 * DTO старта игры.
 * Передаётся при инициализации игровой сессии.
 * @field gameId   Id игры
 * @field stage    Текущая стадия игры (enum GameStages)
 * @field players  Список игроков, участвующих в игре (минимум 1)
 */
export type GameInitDto = z.infer<typeof GameInitDtoSchema>;
