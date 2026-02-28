import type { Deck } from './entities/deck.entity';

const MOCK_DECKS: Deck[] = [
  {
    id: 'mock-deck-1',
    name: 'Базовая колода',
    questionsCount: 5,
    cover: '/icons/blackPhoto.svg',
    questions: [
      { id: 'mock-1-q-1', type: 'general', content: 'Ты когда-нибудь врал, чтобы избежать встречи?', complexity: 1 },
      { id: 'mock-1-q-2', type: 'general', content: 'Ты притворялся занятым, чтобы не отвечать?', complexity: 1 },
      { id: 'mock-1-q-3', type: 'general', content: 'Ты скрывал правду, чтобы никого не обидеть?', complexity: 1 },
      { id: 'mock-1-q-4', type: 'general', content: 'Ты делал вид, что согласен, хотя был против?', complexity: 1 },
      { id: 'mock-1-q-5', type: 'general', content: 'Ты говорил, что уже в пути, хотя ещё не вышел?', complexity: 1 },
    ],
  },
  {
    id: 'mock-deck-2',
    name: 'Эмоции и реакции',
    questionsCount: 5,
    cover: '/icons/blackPhoto.svg',
    questions: [
      { id: 'mock-2-q-1', type: 'emotions', content: 'Ты скрывал обиду, чтобы не выглядеть слабым?', complexity: 2 },
      { id: 'mock-2-q-2', type: 'emotions', content: 'Ты делал вид, что тебе всё равно, хотя это было не так?', complexity: 2 },
      { id: 'mock-2-q-3', type: 'emotions', content: 'Ты ревновал без явного повода?', complexity: 2 },
      { id: 'mock-2-q-4', type: 'emotions', content: 'Ты избегал разговора, потому что боялся последствий?', complexity: 2 },
      { id: 'mock-2-q-5', type: 'emotions', content: 'Ты испытывал тревогу и никому об этом не говорил?', complexity: 2 },
    ],
  },
];

export function getMockDecks(): Deck[] {
  return structuredClone(MOCK_DECKS);
}

export function getMockDeckById(id: string): Deck | null {
  const deck = MOCK_DECKS.find((item) => item.id === id);
  return deck ? structuredClone(deck) : null;
}
