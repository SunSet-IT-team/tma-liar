import z from "zod";
import { PlayerSchema } from "../entities/player.entity";
import { SettingsSchema } from "../entities/settings.entity";
import { LobbyStatus, LobbyScreen } from "../entities/lobby.entity";

export const UpdateLobbyDtoSchema = z.object({
    lobbyCode: z.string(),
    currentGameId: z.string().nullable().optional(),
    status: z.enum(LobbyStatus).optional(),
    currentScreen: z.enum(LobbyScreen).optional(),
    players: z.array(PlayerSchema).optional(),
    settings: SettingsSchema.optional(),
});

/**
 * DTO для обновления лобби
 * @param lobbyCode код лобби
 * @param currentGameId id текущей игры в лобби
 * @param status статус игры в лобби
 * @param currentScreen текущий экран в лобби
 * @param players массив игроков в лобби
 * @param settings настройки лобби
 */
export type UpdateLobbyDto = z.infer<typeof UpdateLobbyDtoSchema>;