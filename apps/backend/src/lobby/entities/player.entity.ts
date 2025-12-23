import type { User } from '../../users/entities/user.entity';
import type { Question } from '../../decks/entities/question.entity';

/**
 * Сущность "Игрок"
 */
export interface Player extends User {
  question: Question;
  score: number;
  liarProbability: number;
  isReady?: boolean;
  loserTask?: string | null; 
}
