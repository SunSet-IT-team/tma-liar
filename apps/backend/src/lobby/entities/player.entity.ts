import type { User } from '../../users/entities/user.entity';

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
