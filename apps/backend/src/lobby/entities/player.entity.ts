import { UserSchema } from '../../users/entities/user.entity';
import type { User } from '../../users/entities/user.entity';
import z from 'zod';

/**
 * Сущность "Игрок"
 */
export interface Player extends User {
  score: number;
  isReady: boolean;
  loserTask: string | null; 
  wasLiar: number;
  answer: number | null;
  likes: number;
  secure: boolean | null;
}

/**Схема сущности "Игрок" */
export const PlayerSchema = UserSchema.extend({
  score: z.number().min(0),
  isReady: z.boolean(),
  loserTask: z.string().nullable(),
  wasLiar: z.number().min(0),
  answer: z.number().nullable(),
  likes: z.number().min(0),
  secure: z.boolean().nullable()
});