import z from "zod";
import { PlayerSchema } from "../entities/player.entity";

export const JoinLobbyDtoSchema = z.object({
    lobbyCode: z.string(),
    player: PlayerSchema,
});

/**
 * DTO для присоединения к лобби
 * @param lobbyCode код лобби
 * @param player игрок, который присоединяется к лобби
 */
export type JoinLobbyDto = z.infer<typeof JoinLobbyDtoSchema>;