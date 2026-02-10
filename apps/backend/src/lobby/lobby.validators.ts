import { ApiError } from "../common/response";
import z from "zod";
import { PlayerSchema } from "./entities/player.entity";
import { SettingsSchema } from "./entities/settings.entity";
import type { 
    LobbyServiceCreateLobbyParams, 
    LobbyServiceDeleteLobbyParams, 
    LobbyServiceFindLobbiesParams,
    LobbyServiceFindLobbyParams,
    LobbyServiceJoinParams,
    LobbyServiceToggleReadyParams,
    LobbyServiceUpdateLobbyParams,
    LobbyServiceStartGameParams
} from "./lobby.params";
import { LobbyStatus, LobbyScreen } from "./entities/lobby.entity";

/**Схемы для валидации DTO lobby */

/**
 * Схема для валидации данных при поиске нескольких лобби
 */
const FindLobbiesDtoSchema = z.object({
    lobbyCodes: z.array(z.string().min(1)),
});

/**
 * Валидатор для lobbyCodes FindLobbiesDto
 * @param lobbyCodes массив кодов лобби
 * @returns массив проверенных кодов лобби
 */
export function findLobbiesCodesValidator(lobbyCodes: unknown): LobbyServiceFindLobbiesParams { 
    const result = FindLobbiesDtoSchema.safeParse({ lobbyCodes });
    if (!result.success) throw new ApiError(400, "LOBBY_CODES_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при поиске лобби
 */
const FindLobbyDtoSchema = z.object({
    lobbyCode: z.string(),
});

/**
 * Валидатор для lobbyCode FindLobbyDto
 * @param lobbyCode код лобби
 * @returns проверенный код лобби
 */
export function findLobbyCodeValidator(lobbyCode: unknown): LobbyServiceFindLobbyParams { 
    const result = FindLobbyDtoSchema.safeParse({ lobbyCode });
    if (!result.success) {
        throw new ApiError(400, "LOBBY_CODE_NOT_SET");
    }

    return result.data;
}

/**
 * Схема для валидации данных при создании лобби
 */
const CreateLobbyDtoSchema = z.object({
    adminId: z.string(),
    players: z.array(PlayerSchema),
    settings: SettingsSchema,
});

/**
 * Валидатор для CreateLobbyDto
 * @param data данные для создания лобби
 * @returns проверенные данные для создания лобби
 */
export function createLobbyValidator(data: unknown): LobbyServiceCreateLobbyParams { 
    const result = CreateLobbyDtoSchema.safeParse(data);
    if (!result.success) throw new ApiError(400, "CREATE_LOBBY_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при удалении лобби
 */
const DeleteLobbyDtoSchema = z.object({
    lobbyCode: z.string(),
});

/**
 * Валидатор для lobbyCode DeleteLobbyDto
 * @param lobbyCode код лобби
 * @returns проверенный код лобби
 */
export function deleteLobbyCodeValidator(lobbyCode: unknown): LobbyServiceDeleteLobbyParams {
    const result = DeleteLobbyDtoSchema.safeParse({ lobbyCode });
    if (!result.success) throw new ApiError(400, "LOBBY_CODE_NOT_SET");

    return result.data;
}

/**
 * Схема для валидации данных при обновлении лобби
 */
const UpdateLobbyDtoSchema = z.object({
    lobbyCode: z.string(),
    players: z.array(PlayerSchema).optional(),
    settings: SettingsSchema.optional(),
    status: z.enum(LobbyStatus).optional(),
    currentScreen: z.enum(LobbyScreen).optional(),
});

/**
 * Валидатор для UpdateLobbyDto
 * @param data данные для обновления лобби
 * @returns проверенные данные для обновления лобби
 */
export function updateLobbyValidator(data: unknown): LobbyServiceUpdateLobbyParams { 
    const result = UpdateLobbyDtoSchema.safeParse(data);
    if (!result.success) throw new ApiError(400, "UPDATE_LOBBY_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при присоединении к лобби
 */
const JoinLobbyDtoSchema = z.object({
    lobbyCode: z.string(),
    player: PlayerSchema,
});

/**
 * Валидатор для JoinLobbyDto
 * @param data данные для присоединения к лобби
 * @returns проверенные данные для присоединения к лобби
 */
export function joinLobbyValidator(data: unknown): LobbyServiceJoinParams { 
    const result = JoinLobbyDtoSchema.safeParse(data);
    if (!result.success) throw new ApiError(400, "JOIN_LOBBY_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при переключении готовности игрока
 */
const ToggleReadyDtoSchema = z.object({
    lobbyCode: z.string(),
    telegramId: z.string(),
    loserTask: z.string().nullable(),
});

/**
 * Валидатор для ToggleReadyDto
 * @param data данные для присоединения к лобби
 * @returns проверенные данные для присоединения к лобби
 */
export function togglePlayerReadyValidator(data: unknown): LobbyServiceToggleReadyParams {
    const result = ToggleReadyDtoSchema.safeParse(data);
    if (!result.success) throw new ApiError(400, "TOGGLE_READY_DATA_INVALID");

    return result.data;
}

/**
 * Схема для валидации данных при начале игры
 */
const StartGameDtoSchema = z.object({
    lobbyCode: z.string(),
    telegramId: z.string(),
    loserTask: z.string().nullable(),
});

export function startGameValidator(data: unknown): LobbyServiceStartGameParams {
    const result = StartGameDtoSchema.safeParse(data);
    if (!result.success) throw new ApiError(400, "START_GAME_DATA_INVALID");

    return result.data;
}