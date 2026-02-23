import z from "zod";

/**
 * DTO для toggleReady в лобби
 * @param lobbyCode код лобби 
 * @param playerId id игрока
 * @param loserTask задание для проигравшего
 */
export const ToggleReadyDtoSchema = z.object({
  lobbyCode: z.string().nonempty(),
  playerId: z.string().nonempty(),
  loserTask: z.string().nullable().optional(),
});

/**
 * Тип для toggleReady
 */
export type ToggleReadyDto = z.infer<typeof ToggleReadyDtoSchema>;