import z from "zod";
import { PlayerSchema } from "../../lobby/entities/player.entity";
import { SettingsSchema } from "../../lobby/entities/settings.entity";
import { GameStages } from "../../lobby/entities/lobby.entity";

/**
 * Схема для DTO начала игры
 */
export const GameStartDtoSchema = z.object({
  lobbyCode: z.string().min(1),
  player: PlayerSchema,
  settings: SettingsSchema,
}).transform(data => ({
  lobbyCode: data.lobbyCode,
  player: data.player,
  settings: data.settings,
  stage: GameStages.LOBBY,
  liarId: null,
  questionHistory: [],
  activeQuestion: null,
  timerId: null,
  doLie: null,
  loserTask: null,
  winnerId: null,
  loserId: null,
}));

/**
 * DTO для начала игры
 * @field lobbyCode код лобби
 * @field player игрок, которым запускается игра
 * @field settings настройки игры
 */
export type GameStartDto = z.infer<typeof GameStartDtoSchema>;
