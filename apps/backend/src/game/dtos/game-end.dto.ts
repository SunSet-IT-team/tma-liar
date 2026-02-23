import z from "zod";

export const GameEndDtoSchema = z.object({
    doLie: z.boolean(),                  
    loserTask: z.string().min(1),        
    winnerId: z.string().min(1),
    loserId: z.string().min(1)
});

/**
 * DTO окончания игры 
 * Передаётся при окончании игры
 * @field doLie      Врал лжец или нет 
 * @field loserTask  Задание проигравшему
 * @field winnerId   Id победителя
 * @field loserId    Id проигравшего
 */
export type GameEndDto = z.infer<typeof GameEndDtoSchema>;