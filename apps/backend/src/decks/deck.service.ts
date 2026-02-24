import type { Deck } from './entities/deck.entity';
import { ApiError } from '../common/response';
import { DeckModel } from './deck.model';
import type { FindDeckDto } from './dtos/deck-find.dto';
import type { CreateDeckDto } from './dtos/deck-create.dto';
import type { UpdateDeckDto } from './dtos/deck-update.dto';
import type { DeleteDeckDto } from './dtos/deck-delete.dto';

/**
 * Интерфейс для сервиса колод
 */
export interface DeckServiceMethods {
  findDeck: (param: FindDeckDto) => Promise<Deck>;
  findDecks: () => Promise<Deck[]>;
  createDeck: (param: CreateDeckDto) => Promise<Deck>;
  updateDeck: (param: UpdateDeckDto) => Promise<Deck>;
  deleteDeck: (param: DeleteDeckDto) => Promise<Deck>;
}

/**
 * Сервис колод
 */
export class DeckService implements DeckServiceMethods {
  /** Найти одну колоду */
  public async findDeck(param: FindDeckDto): Promise<Deck> {
    const deck = await DeckModel.findOne({ _id: param.id });

    if (!deck) {
      throw new ApiError(400, 'DECK_NOT_FOUND');
    }

    return deck.toObject();
  }

  /** Найти несколько колод */
  public async findDecks(): Promise<Deck[]> {
    const decks = await DeckModel.find().lean();

    if (!decks || decks.length === 0) throw new ApiError(400, 'DECKS_NOT_FOUND');
    return decks;
  }

  /** Создать колоду */
  public async createDeck(param: CreateDeckDto): Promise<Deck> {
    const deck = await DeckModel.create(param);

    if (!deck) throw new ApiError(400, 'DECK_NOT_CREATED');
    return deck.toObject();
  }

  /** Обновить колоду */
  public async updateDeck(param: UpdateDeckDto): Promise<Deck> {
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
  public async deleteDeck(param: DeleteDeckDto): Promise<Deck> {
    const deletedDeck = await DeckModel.findOneAndDelete({ _id: param.id }).lean();

    if (!deletedDeck) {
      throw new ApiError(400, 'DECK_NOT_FOUND');
    }

    return deletedDeck;
  }
}
