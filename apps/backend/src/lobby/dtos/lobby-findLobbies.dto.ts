import z from "zod";

/**
 * Схема для валидации данных при поиске нескольких лобби
 */
const FindLobbiesDtoSchema = z.object({
    lobbyCodes: z.array(z.string().min(1)),
});

/**
 * DTO для findLobbies
 * @param lobbyCodes массив кодов лобби
 */
export type FindLobbiesDto = z.infer<typeof FindLobbiesDtoSchema>;