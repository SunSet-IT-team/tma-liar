import type { Question } from './question.entity';

/**
 * Сущность ""
 */
export interface Deck {
  name: string;
  questionsCount: number;
  cover: string;
  questions: Question[];
}

export interface DeckExt extends Deck {
  _embedded: {
    questions: Question[];
  };
}
