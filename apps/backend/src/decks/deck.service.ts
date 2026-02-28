import type { Deck } from './entities/deck.entity';
import { ApiError } from '../common/response';
import type { FindDeckDto } from './dtos/deck-find.dto';
import type { CreateDeckDto } from './dtos/deck-create.dto';
import type { UpdateDeckDto } from './dtos/deck-update.dto';
import type { DeleteDeckDto } from './dtos/deck-delete.dto';
import { DeckRepository } from './deck.repository';
import { getMockDeckById, getMockDecks } from './mock-decks';

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
  constructor(private readonly deckRepository: DeckRepository = new DeckRepository()) {}

  /** Найти одну колоду */
  public async findDeck(param: FindDeckDto): Promise<Deck> {
    const deck = await this.deckRepository.findById(param.id);

    if (deck) {
      return deck;
    }

    const mockDeck = getMockDeckById(param.id);

    if (mockDeck) {
      return mockDeck;
    }

    throw new ApiError(404, 'DECK_NOT_FOUND');
  }

  /** Найти несколько колод */
  public async findDecks(): Promise<Deck[]> {
    const decks = await this.deckRepository.findAll();

    if (decks && decks.length > 0) {
      return decks;
    }

    return getMockDecks();
  }

  /** Создать колоду */
  public async createDeck(param: CreateDeckDto): Promise<Deck> {
    const deck = await this.deckRepository.create(param);

    if (!deck) throw new ApiError(400, 'DECK_NOT_CREATED');
    return deck;
  }

  /** Обновить колоду */
  public async updateDeck(param: UpdateDeckDto): Promise<Deck> {
    const updatedDeck = await this.deckRepository.updateById(param);

    if (!updatedDeck) {
      throw new ApiError(404, 'DECK_NOT_FOUND');
    }

    return updatedDeck;
  }

  /** Удалить колоду */
  public async deleteDeck(param: DeleteDeckDto): Promise<Deck> {
    const deletedDeck = await this.deckRepository.deleteById(param.id);

    if (!deletedDeck) {
      throw new ApiError(404, 'DECK_NOT_FOUND');
    }

    return deletedDeck;
  }
}
