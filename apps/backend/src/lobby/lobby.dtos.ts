import type { Player } from "./entities/player.entity";
import type { Settings } from "./entities/settings.entity";
import type { 
    LobbyServiceCreateLobbyParams, 
    LobbyServiceJoinParams, 
    LobbyServiceStartGameParams, 
    LobbyServiceToggleReadyParams, 
    LobbyServiceUpdateLobbyParams 
} from "./lobby.params";
import type { LobbyScreen, LobbyStatus } from "./entities/lobby.entity";

/**DTO для лобби */

/**
 * DTO для createLobby
 * @param adminId id администратора лобби
 * @param players массив игроков в лобби
 * @param settings настройки лобби
 */
export class CreateLobbyDto { 
    adminId: string;
    players: Player[];
    settings: Settings;

    constructor(data: LobbyServiceCreateLobbyParams) { 
        this.adminId = data.adminId;
        this.players = data.players;
        this.settings = data.settings;
        this.settings = data.settings;
    }
}

/**
 * DTO для deleteLobby
 * @param lobbyCode код лобби
 */
export class DeleteLobbyDto { 
    lobbyCode: string;

    constructor(lobbyCode: string) { 
        this.lobbyCode = lobbyCode;
    }
}

/**
 * DTO для findLobby
 * @param lobbyCode код лобби
 */
export class FindLobbyDto { 
    lobbyCode: string;
    
    constructor(lobbyCode: string) { 
        this.lobbyCode = lobbyCode;
    }
}

/**
 * DTO для findLobbies
 * @param lobbyCodes массив кодов лобби
 */
export class FindLobbiesDto { 
    lobbyCodes: string[];

    constructor(lobbyCodes: string[]) { 
        this.lobbyCodes = lobbyCodes;
    }
}

/**
 * DTO для updateLobby
 * @param lobbyCode код лобби
 * @param players массив игроков в лобби
 * @param settings настройки лобби
 * @param status статус игры в лобби
 * @param currentScreen текущий экран в лобби
 */
export class UpdateLobbyDto { 
    lobbyCode: string;
    players: Player[] | undefined
    settings: Settings | undefined;
    status: LobbyStatus | undefined;
    currentScreen: LobbyScreen | undefined;

    constructor(data: LobbyServiceUpdateLobbyParams) { 
        this.lobbyCode = data.lobbyCode;
        this.players = data.players;
        this.settings = data.settings;
        this.status = data.status;
        this.currentScreen = data.currentScreen;
    }
}

/**
 * DTO для присоединения к лобби
 * @param lobbyCode код лобби
 * @param player игрок, который присоединяется к лобби
 */
export class JoinLobbyDto { 
    lobbyCode: string; 
    player: Player;

    constructor(data: LobbyServiceJoinParams) { 
        this.lobbyCode = data.lobbyCode;
        this.player = data.player;
    }
}

/**
 * DTO для переключения готовности игрока
 * @param lobbyCode код лобби
 * @param player игрок, которому переключают готовность
 * @param loserTask задание для проигравшего
 */
export class ToggleReadyDto {
    lobbyCode: string;
    telegramId: string;
    loserTask: string | null;

    constructor(data: LobbyServiceToggleReadyParams) {
        this.lobbyCode = data.lobbyCode;
        this.telegramId = data.telegramId;
        this.loserTask = data.loserTask;
    }
}

/**
 * DTO для начала игры
 * @param lobbyCode код лобби
 * @param player игрок, который присоединяется к лобби
 */
export class StartGameDto {
    lobbyCode: string;
    telegramId: string;
    loserTask: string | null;

    constructor(data: LobbyServiceStartGameParams) {
        this.lobbyCode = data.lobbyCode;
        this.telegramId = data.telegramId;
        this.loserTask = data.loserTask;
    }
}