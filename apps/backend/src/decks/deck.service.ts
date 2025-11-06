import type {
  DeckApiFindDeckParams,
  DeckApiFindDecksParams,
  DeckApiCreateDeckParams,
  DeckApiUpdateDeckParams,
  DeckApiDeleteDeckParams,
} from './deck.params';
import type { Deck } from './entities/deck.entity';

/**
 * Интерфейс для API колод
 */
export interface DeckApiMethods {
  findDeck: (param: DeckApiFindDeckParams) => Promise<Deck | null>;
  findDecks: (param?: DeckApiFindDecksParams) => Promise<Deck[] | []>;
  createDeck: (param: DeckApiCreateDeckParams) => Promise<Deck | null>;
  updateDeck: (param: DeckApiUpdateDeckParams) => Promise<Deck | null>;
  deleteDeck: (param: DeckApiDeleteDeckParams) => Promise<Deck>;
}

/**
 * API для колод
 */
export class DeckApi implements DeckApiMethods {
  decks = new Map<number, Deck>();

  public async findDeck(param?: DeckApiFindDeckParams): Promise<Deck | null> {
    return new Promise((resolve, reject) => {
      // Поиск по id
      if (param?.id) {
        try {
          resolve(this.decks.get(param.id) || null);
        } catch (err) {
          reject(err);
        }
      }
      resolve(null);
    });
  }

  public findDecks(param?: DeckApiFindDecksParams): Promise<Deck[] | []> {
    return new Promise((resolve, reject) => {
      // поиск колод по id
      if (param?.ids) {
        const deckIds = param.ids;
        let decksArray: Deck[] = [];
        try {
          for (let key of deckIds) {
            const deck = this.decks.get(key);
            if (deck) {
              decksArray.push(deck);
            }
          }
          resolve(decksArray);
        } catch (err) {
          reject(err);
        }
      }
      resolve([]);
    });
  }

  public createDeck(param: DeckApiCreateDeckParams): Promise<Deck | null> {
    return new Promise((resolve, reject) => {
      try {
        const newDeckId = this.decks.size + 1;
        this.decks.set(newDeckId, { id: newDeckId, ...param } as Deck);
        resolve(this.decks.get(newDeckId) || null);
      } catch (err) {
        reject(err);
      }
    });
  }

  public updateDeck(param?: DeckApiUpdateDeckParams): Promise<Deck | null> {
    return new Promise((resolve, reject) => {
      try {
        if (param?.id && this.decks.get(param?.id)) {
          const deckToUpdate = this.decks.get(param.id);
          if (deckToUpdate) {
            this.decks.set(param.id, { ...deckToUpdate, ...(param as Deck) });
          } else {
            reject('DECK_NOT_EXIST');
          }
          resolve(this.decks.get(param.id) || null);
        } else {
          reject('DECK_ID_NOT_SET');
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  public deleteDeck(param?: DeckApiDeleteDeckParams): Promise<Deck> {
    return new Promise((resolve, reject) => {
      try {
        if (param?.id && this.decks.get(param?.id)) {
          const deckToDelete = this.decks.get(param?.id);
          if (this.decks.delete(param.id)) {
            resolve(deckToDelete!);
          } else {
            reject('DECK_NOT_EXIST');
          }
        } else {
          reject('DECK_ID_NOT_SET');
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}
