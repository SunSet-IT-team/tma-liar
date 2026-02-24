import z from "zod";
import { isValidObjectId } from "mongoose";

/**
 * Схема для DTO голосования игрока
 */
export const GamePlayerVotedDtoSchema = z.object({
  gameId: z.string().nonempty().refine(val => isValidObjectId(val), {
    message: "INVALID_GAME_ID"
  }),
  playerId: z.string().min(1),
  answer: z.number().int().min(0).max(2),
});

/**
 * DTO для голосования игрока
 * @field gameId id игры
 * @field playerId id игрока
 * @field answer ответ игрока (0 - не верит, 1 - верит, 2 - не определился)
 */
export type GamePlayerVotedDto = z.infer<typeof GamePlayerVotedDtoSchema>;
