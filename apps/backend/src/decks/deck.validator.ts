import { QuestionSchema } from "../decks/entities/question.entity";
import { ApiError } from "../common/response";
import z from "zod";
import type { DeckServiceCreateDeckParams } from "../decks/deck.params";
import { isValidObjectId } from "mongoose";
import type { 
    DeckServiceFindDecksParams, 
    DeckServiceUpdateDeckParams  
} from "../decks/deck.params";

/**
 * Валидаторы данных для Deck
 */

/**
 * Схема для валидации данных при создании колоды
 */
const CreateDeckDtoSchema = z.object({
    name: z.string().min(2).max(100),
    questionsCount: z.number().positive(),
    cover: z.string().min(2).max(100),
    questions: z.array(QuestionSchema)
});

/**
 * Валидатор для CreateDeckDto
 * @param name название колоды
 * @param questionsCount количество вопросов в колоде
 * @param cover обложка колоды
 * @param questions массив заданных вопросов
 * @returns кортеж [name, questionsCount, cover, questions]
 */
export function createDeckValidator(data: unknown): DeckServiceCreateDeckParams{ 
    const result = CreateDeckDtoSchema.safeParse(data);

    if (!result.success) throw new ApiError(400, "CREATE_DECK_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при поиске нескольких колод
 */
const FindDecksDtoSchema = z.object({
    ids: z.array(z.string().min(1)).refine(ids => ids.every(id => isValidObjectId(id)), {
        message: "IDS_DATA_INVALID"
    }),
});

/**
 * Валидатор для ids FindDecksDto
 * @param ids массив айди колод
 * @returns массив проверенных айди
 */
export function findDecksIdsValidator(ids: unknown): DeckServiceFindDecksParams { 
    const result = FindDecksDtoSchema.safeParse({ ids });
    if (!result.success) throw new ApiError(400, "IDS_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при поиске колоды
 */
const FindDeckDtoSchema = z.object({
    id: z.string().nonempty().refine(val => isValidObjectId(val), {
        message: "DECK_ID_NOT_SET"
    }),
});

/**
 * Валидатор для id FindDeckDto
 * @param id айди колоды
 * @returns проверенный айди
 */
export function findDeckIdValidator(id: unknown): string { 
    const result = FindDeckDtoSchema.safeParse({ id });
    if (!result.success) {
        throw new ApiError(400, "DECK_ID_NOT_SET");
    }

    return result.data.id;
}

/**
 * Схема для валидации данных при удалении колоды
 */
const DeleteDeckDtoSchema = z.object({
    id: z.string().nonempty().refine(val => isValidObjectId(val), {
        message: "DECK_ID_NOT_SET"
    }),
});

/**
 * Валидатор для id DeleteDeckDto
 * @param id айди колоды
 * @returns проверенный айди
 */
export function deleteDeckIdValidator(id: unknown): string { 
    const result = DeleteDeckDtoSchema.safeParse({ id });
    if (!result.success) {
        throw new ApiError(400, "DECK_ID_NOT_SET");
    }

    return result.data.id;
}

/**
 * Схема валидации данных для обновления колоды
 */
const updateDeckSchema = z.object({
  id: z.string().nonempty().refine(val => isValidObjectId(val), {
    message: "DECK_ID_NOT_SET"
  }),
  name: z.string().optional(),
  questionsCount: z.number().optional(),
  cover: z.string().optional(),
  questions: z.array(QuestionSchema).optional()
}).transform((data) => {
  const { id, ...rest } = data;
  const updateFields = Object.fromEntries(
    Object.entries(rest).filter(([_, val]) => val !== undefined)
  );
  return { id, ...updateFields };
});


/**
 * Валидатор для UdpateDeckDto
 * @param id айди колоды
 * @param name название кололы
 * @param questionsCount количество вопросов в колоде
 * @param cover обложка колоды
 * @param questions массив вопросов колоды
 * @returns кортеж из валидированных данных для обновления колоды
 */
export function updateDeckValidator(data: unknown): DeckServiceUpdateDeckParams {
    const result = updateDeckSchema.safeParse(data);

    if (!result.success) {
        throw new ApiError(400, "UPDATE_DECK_DATA_INVALID");
    }

    return result.data;
}