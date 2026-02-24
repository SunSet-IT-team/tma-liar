import z from "zod";

/**
 * Схема для валидации данных при поиске лобби
 */
export const FindLobbyDtoSchema = z.object({
    lobbyCode: z.string(),
});

/**
 * DTO для findLobby
 * @param lobbyCode код лобби
 */
export type FindLobbyDto = z.infer<typeof FindLobbyDtoSchema> 
