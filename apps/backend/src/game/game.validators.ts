import { ApiError } from "../common/response";
import { isValidObjectId } from "mongoose";
import z from "zod";
import { PlayerSchema } from "../lobby/entities/player.entity";
import { SettingsSchema } from "../lobby/entities/settings.entity";
import { GameStages } from "../lobby/entities/lobby.entity";
import type { 
    GameStartParams,
    GameLikeAnswerParams,
    GameNextStageParams,
    GameSetAnswerParams, 
    GameFindParams, 
    GameLiarChoosesParams, 
    GameConfirmAnswerParams
} from "./game.params";

/**
 * Схемы для валидации DTO game
 */
export const GameStartDtoSchema = z
    .object({
        lobbyId: z
            .string()
            .nonempty()
            .refine(val => isValidObjectId(val), {
                message: "DECK_ID_NOT_SET",
            }),

        players: z.array(PlayerSchema),

        settings: SettingsSchema,
    })
    .transform(data => ({
        lobbyId: data.lobbyId,
        players: data.players,
        settings: data.settings,
        stage: GameStages.LOBBY,  
        liarId: null,
        questionHistory: [],
        activeQuestion: null,
        timerId: null,
        doLie: null,
        loserTask: null,
        winnerId: null,
        loserId: null,
    }));

/**
 * Валидатор для данных при инициализации игры
 * @param gameId id игры
 * @returns проверенный id
 */
export function startGameValidator(gameId: GameStartParams): GameStartParams { 
    const result = GameStartDtoSchema.safeParse({ gameId });
    if (!result.success) throw new ApiError(400, "GAME_INITIALIZE_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при переходе на следующую стадию
 */
const GameNextStageDtoSchema = z.object({
    gameId: z.string().min(1),
});

/**
 * Валидатор для данных при переходе на следующую стадию
 * @param gameId код игры
 * @returns проверенный код игры
 */
export function nextStageValidator(lobbyCode: unknown): GameNextStageParams {
    const result = GameNextStageDtoSchema.safeParse({ lobbyCode });
    if (!result.success) throw new ApiError(400, "NEXT_STAGE_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при лайке ответа
 */
const GameLikeAnswerDtoSchema = z.object({
    gameId: z.string().min(1),
    senderId: z.string().min(1),
    receiverId: z.string().min(1),
});

/**
 * Валидатор для данных при лайке ответа
 * @param data данные для лайка
 * @returns проверенные данные
 */
export function likeAnswerValidator(data: GameLikeAnswerParams): GameLikeAnswerParams {
    const result = GameLikeAnswerDtoSchema.safeParse(data);
    if (!result.success) throw new ApiError(400, "LIKE_ANSWER_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при установке ответа
 */
const GameSetAnswerDtoSchema = z.object({
    gameId: z.string().min(1),
    playerId: z.string().min(1),
    answer: z.number().int().min(0).max(2),
});

/**
 * Валидатор для данных при установке ответа
 * @param data данные для установки ответа
 * @returns проверенные данные
 */
export function setAnswerValidator(data: unknown): GameSetAnswerParams {
    const result = GameSetAnswerDtoSchema.safeParse(data);
    if (!result.success) throw new ApiError(400, "SET_ANSWER_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при поиске игры
 */
const FindGameDtoSchema = z.object({
    gameId: z.string().min(1),
});

/**
 * Валидатор для поиска игры
 * @param data данные поиска
 * @returns проверенные данные
 */
export function findGameValidator(data: GameFindParams): GameFindParams {
    const result = FindGameDtoSchema.safeParse(data);
    if (!result.success) throw new ApiError(400, "FIND_GAME_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при подтверждении отыета
 */
const ConfirmAnswerSchema = z.object({
    gameId: z.string().min(1),
    playerId: z.string().min(1),
});

/**
 * Валидатор для подтверждения ответа
 * @param data данные 
 * @returns проверенные данные
 */
export function confirmAnswerValidator(data: unknown): GameConfirmAnswerParams {
    const result = ConfirmAnswerSchema.safeParse(data);
    if (!result.success) throw new ApiError(400, "SECURE_ANSWER_DATA_INVALID");

    return result.data;
}

/**
 * Схема валидации выбора лжеца
 */
const LiarChoosesDtoSchema = z.object({
  gameId: z.string().nonempty().refine(id => isValidObjectId(id), {
    message: 'GAME_ID_NOT_SET',
  }),
  answer: z.boolean(),
});

/**
 * Валидатор для выбора лжеца
 * @param gameId id игры
 * @param answer будет ли лжец врать
 * @returns валидированные данные
 */
export function liarChoosesValidator(data: unknown): GameLiarChoosesParams {
  const result = LiarChoosesDtoSchema.safeParse(data);

  if (!result.success) {
    throw new ApiError(400, 'LIAR_CHOOSES_DATA_INVALID');
  }

  return result.data;
}
