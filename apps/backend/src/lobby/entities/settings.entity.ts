import type { Deck } from '../../decks/entities/deck.entity';

/**
 * Сущность "Настройки"
 */
export interface Settings {
  deck: Deck;
  deckId: number;
  questionCount: number;
  answerTime: number;
}
