import z from "zod";
import { PlayerSchema } from "../entities/player.entity";
import { SettingsSchema } from "../entities/settings.entity";

export const CreateLobbyDtoSchema = z.object({
  adminId: z.string().nonempty(),
  players: z.array(PlayerSchema),
  settings: SettingsSchema,
});

/**
 * DTO для createLobby
 * @param adminId id администратора лобби
 * @param players массив игроков в лобби
 * @param settings настройки лобби
 */
export type CreateLobbyDto = z.infer<typeof CreateLobbyDtoSchema>;