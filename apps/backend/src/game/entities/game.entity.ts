import { GameStages } from "../../lobby/entities/lobby.entity";
import type { Player } from "../../lobby/entities/player.entity";
import type { Settings } from "../../lobby/entities/settings.entity";

/**
 * Сущность "Игра"
 */
export interface Game {
    lobbyId: string;
    stage: GameStages;
    players: Player[] | [];
    settings: Settings;
    liarId: string | null;
    questionHistory: string[];
    activeQuestion: string | null;
    timerId: NodeJS.Timeout | null;
    doLie: boolean | null;
    loserTask: string | null;
    winnerId: string | null;
    loserId: string | null;
}

/* export const GameSchema = z.object({
    lobbyId: z.string(),
    stage: z.enum(GameStages),
    players: z.array(PlayerSchema).optional(), */