import type {
  DeckServiceFindDeckParams,
  DeckServiceFindDecksParams,
  DeckServiceCreateDeckParams,
  DeckServiceUpdateDeckParams,
  DeckServiceDeleteDeckParams,
} from './deck.params';

import type { Deck } from './entities/deck.entity';
import { ApiError } from '../common/response';
import { DeckModel } from './deck.model';

/**
 * Интерфейс для сервиса колод
 */
export interface DeckServiceMethods {
  findDeck: (param: DeckServiceFindDeckParams) => Promise<Deck>;
  findDecks: (param: DeckServiceFindDecksParams) => Promise<Deck[]>;
  createDeck: (param: DeckServiceCreateDeckParams) => Promise<Deck>;
  updateDeck: (param: DeckServiceUpdateDeckParams) => Promise<Deck>;
  deleteDeck: (param: DeckServiceDeleteDeckParams) => Promise<Deck>;
}

/**
 * Сервис колод
 */
export class DeckService implements DeckServiceMethods {
  /** Найти одну колоду */
  public async findDeck(param: DeckServiceFindDeckParams): Promise<Deck> {
    const deck = await DeckModel.findOne({ _id: param.id }).lean();

    if (!deck) throw new ApiError(400, 'DECK_NOT_FOUND');

    return deck;
  }

  /** Найти несколько колод */
  public async findDecks(param: DeckServiceFindDecksParams): Promise<Deck[]> {
    const decks = await DeckModel.find({ _id: { $in: param.ids } }).lean();

    if(!decks || decks.length == 0) throw new ApiError(400, 'DECKS_NOT_FOUND');

    return decks;
  }

  /** Создать колоду */
  public async createDeck(param: DeckServiceCreateDeckParams): Promise<Deck> {
    const deck = await DeckModel.create(param);

    if(!deck) throw new ApiError(400, 'DECK_NOT_CREATED');
    return deck.toObject();
  }

  /** Обновить колоду */
  public async updateDeck(param: DeckServiceUpdateDeckParams): Promise<Deck> {
    const { id, ...updateFields } = param;

    const updatedDeck = await DeckModel.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updatedDeck) {
      throw new ApiError(400, 'DECK_NOT_FOUND');
    }

    return updatedDeck;
  }

  /** Удалить колоду */
  public async deleteDeck(param: DeckServiceDeleteDeckParams): Promise<Deck> {
    const deletedDeck = await DeckModel.findOneAndDelete({ _id: param.id }).lean();

    if (!deletedDeck) {
      throw new ApiError(400, 'DECK_NOT_FOUND');
    }

    return deletedDeck;
  }
}
