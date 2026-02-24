import z from "zod";
import { isValidObjectId } from "mongoose";

/**
 * Схема для DTO выбора лжеца
 */
export const GameLiarChoosesDtoSchema = z.object({
  gameId: z.string().nonempty().refine(val => isValidObjectId(val), {
    message: "INVALID_GAME_ID"
  }),
  answer: z.boolean(),
});

/**
 * DTO для выбора лжеца
 * @field gameId id игры
 * @field answer будет ли лжец врать (true - будет врать, false - не будет врать)
 */
export type GameLiarChoosesDto = z.infer<typeof GameLiarChoosesDtoSchema>;
