import type { Question } from './question.entity';

/**
 * Сущность ""
 */
export interface Deck {
  id: number;
  name: string;
  questionsCount: number;
  cover: string;
  questions: number;
}

export interface DeckExt extends Deck {
  _embedded: {
    questions: Question[];
  };
}
