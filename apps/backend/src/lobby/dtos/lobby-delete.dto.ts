import z from "zod";

/**
 * Схема для валидации данных при удалении лобби
 */
export const DeleteLobbyDtoSchema = z.object({
    lobbyCode: z.string().min(1),
});

/**
 * DTO для deleteLobby
 * @param lobbyCode код лобби
 */
export type DeleteLobbyDto = z.infer<typeof DeleteLobbyDtoSchema> 
