import z from "zod";
import { LobbyStatus } from "../entities/lobby.entity";
import { PlayerInfoSchema } from "../../game/dtos/game-init.dto";

/**
 * Схема для DTO состояния лобби
 */
export const LobbyStateDtoSchema = z.object({
  lobbyCode: z.string().nonempty(),
  adminId: z.string().nonempty(),
  currentGameId: z.string().nullable(), 
  status: z.enum(LobbyStatus),   
  players: z.array(PlayerInfoSchema), 
});

/**
 * DTO для state lobby
 * @param lobbyCode код лобби 
 * @param adminId id администратора лобби
 * @param players массив игроков в лобби
 */
export type LobbyStateDto = z.infer<typeof LobbyStateDtoSchema>;