import { UserSchema } from '../../users/entities/user.entity';
import type { User } from '../../users/entities/user.entity';
import z from 'zod';

/**
 * Сущность "Игрок"
 */
export interface Player extends User {
  score: number;
  isReady: boolean;
  inGame?: boolean;
  loserTask: string | null; 
  wasLiar: number;
  answer: number | null;
  likes: number;
  isConfirmed: boolean | null;
}

/**Схема сущности "Игрок" */
export const PlayerSchema = UserSchema.extend({
  score: z.number().min(0).optional().default(0),
  isReady: z.boolean(),
  inGame: z.boolean().optional(),
  loserTask: z.string().nullable().optional(),
  wasLiar: z.number().min(0).optional().default(0),
  answer: z.number().nullable().optional().default(null),
  likes: z.number().min(0).optional().default(0),
  isConfirmed: z.boolean().nullable().default(false)
});
