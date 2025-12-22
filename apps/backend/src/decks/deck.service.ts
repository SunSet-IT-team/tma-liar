import type {
  DeckApiFindDeckParams,
  DeckApiFindDecksParams,
  DeckApiCreateDeckParams,
  DeckApiUpdateDeckParams,
  DeckApiDeleteDeckParams,
} from './deck.params';

import type { Deck } from './entities/deck.entity';
import { ApiError } from '../common/response';
import { DeckModel } from './deck.model';

/**
 * Интерфейс для API колод
 */
export interface DeckApiMethods {
  findDeck: (param?: DeckApiFindDeckParams) => Promise<Deck | null>;
  findDecks: (param?: DeckApiFindDecksParams) => Promise<Deck[] | []>;
  createDeck: (param: DeckApiCreateDeckParams) => Promise<Deck>;
  updateDeck: (param: DeckApiUpdateDeckParams) => Promise<Deck>;
  deleteDeck: (param: DeckApiDeleteDeckParams) => Promise<Deck>;
}

/**
 * API для колод
 */
export class DeckApi implements DeckApiMethods {
  public async findDeck(param?: DeckApiFindDeckParams): Promise<Deck | null> {
    if (!param?.id) {
      throw new ApiError(400, 'DECK_ID_NOT_SET');
    }

    return DeckModel.findOne({ _id: param.id }).lean();
  }

  public async findDecks(param?: DeckApiFindDecksParams): Promise<Deck[] | []> {
    if (!param?.ids || param.ids.length === 0) {
      throw new ApiError(400, 'DECK_IDS_NOT_SET');
    }

    return DeckModel.find({ _id: { $in: param.ids } }).lean();
  }

  public async createDeck(param: DeckApiCreateDeckParams): Promise<Deck> {
    if (!param.name) {
      throw new ApiError(400, 'DECK_NAME_NOT_SET');
    }

    if (!param.questions) {
      throw new ApiError(400, 'QUESTIONS_NOT_SET');
    }

    return (await DeckModel.create(param)).toObject();
  }

  public async updateDeck(param: DeckApiUpdateDeckParams): Promise<Deck> {
    if (!param.id) {
      throw new ApiError(400, 'DECK_ID_NOT_SET');
    }

    const { id, ...updateFields } = param;

    const updatedDeck = await DeckModel.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updatedDeck) {
      throw new ApiError(404, 'DECK_NOT_FOUND');
    }

    return updatedDeck;
  }

  /** Удалить колоду */
  public async deleteDeck(param: DeckApiDeleteDeckParams): Promise<Deck> {
    if (!param.id) {
      throw new ApiError(400, 'DECK_ID_NOT_SET');
    }

    const deletedDeck = await DeckModel.findOneAndDelete({ _id: param.id }).lean();

    if (!deletedDeck) {
      throw new ApiError(404, 'DECK_NOT_FOUND');
    }

    return deletedDeck;
  }
}
