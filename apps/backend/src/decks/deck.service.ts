import type { Deck } from './entities/deck.entity';
import { ApiError } from '../common/response';
import type { FindDeckDto } from './dtos/deck-find.dto';
import type { CreateDeckDto } from './dtos/deck-create.dto';
import type { UpdateDeckDto } from './dtos/deck-update.dto';
import type { DeleteDeckDto } from './dtos/deck-delete.dto';
import { DeckRepository } from './deck.repository';
import { YooKassaService } from './yookassa.service';
import { env } from '../config/env';
import { logger } from '../observability/logger';
import { DeckPurchaseRepository } from './deck-purchase.repository';

/**
 * Интерфейс для сервиса колод
 */
export interface DeckServiceMethods {
  findDeckRaw: (param: FindDeckDto) => Promise<Deck>;
  findDecksRaw: () => Promise<Deck[]>;
  findDeck: (param: FindDeckDto, viewerTelegramId?: string | null) => Promise<Deck>;
  findDecks: (viewerTelegramId?: string | null) => Promise<Deck[]>;
  createDeck: (param: CreateDeckDto) => Promise<Deck>;
  updateDeck: (param: UpdateDeckDto) => Promise<Deck>;
  deleteDeck: (param: DeleteDeckDto) => Promise<Deck>;
  createDeckPurchase: (param: { deckId: string; telegramId: string }) => Promise<{ paymentId: string; confirmationUrl: string; alreadyPurchased: boolean }>;
  confirmDeckPurchase: (param: { deckId: string; telegramId: string; paymentId: string }) => Promise<{ purchased: boolean }>;
}

/**
 * Сервис колод
 */
export class DeckService implements DeckServiceMethods {
  constructor(
    private readonly deckRepository: DeckRepository = new DeckRepository(),
    private readonly yooKassaService: YooKassaService = new YooKassaService(),
    private readonly deckPurchaseRepository: DeckPurchaseRepository = new DeckPurchaseRepository(),
  ) {}

  private resolveDeckId(deck: Deck): string {
    const rawDeck = deck as Deck & { _id?: unknown };
    if (deck.id && typeof deck.id === 'string') {
      return deck.id;
    }
    if (typeof rawDeck._id === 'string') {
      return rawDeck._id;
    }
    if (rawDeck._id && typeof rawDeck._id === 'object' && 'toString' in rawDeck._id) {
      return (rawDeck._id as { toString: () => string }).toString();
    }
    return '';
  }

  private async toDeckView(deck: Deck, viewerTelegramId?: string | null): Promise<Deck> {
    const deckId = this.resolveDeckId(deck);
    const isPaid = (deck.priceRub ?? 0) > 0;
    const purchasedInDeck =
      Boolean(viewerTelegramId && deck.purchasedBy?.includes(viewerTelegramId));
    const purchasedInRegistry = viewerTelegramId
      ? await this.deckPurchaseRepository.isPurchased(deckId, viewerTelegramId)
      : false;

    const isPurchased = !isPaid || purchasedInDeck || purchasedInRegistry;
    const isLocked = isPaid && !isPurchased;

    return {
      ...deck,
      id: deckId || deck.id,
      isPaid,
      isPurchased,
      isLocked,
      purchasedBy: undefined,
    };
  }

  /** Найти одну колоду */
  public async findDeckRaw(param: FindDeckDto): Promise<Deck> {
    const deck = await this.deckRepository.findById(param.id);
    if (!deck) {
      throw new ApiError(404, 'DECK_NOT_FOUND');
    }
    return deck;
  }

  /** Найти несколько колод */
  public async findDecksRaw(): Promise<Deck[]> {
    const decks = await this.deckRepository.findAll();
    return decks;
  }

  /** Найти одну колоду */
  public async findDeck(param: FindDeckDto, viewerTelegramId?: string | null): Promise<Deck> {
    const deck = await this.findDeckRaw(param);
    return this.toDeckView(deck, viewerTelegramId);
  }

  /** Найти несколько колод */
  public async findDecks(viewerTelegramId?: string | null): Promise<Deck[]> {
    const decks = await this.findDecksRaw();
    return Promise.all(decks.map((deck) => this.toDeckView(deck, viewerTelegramId)));
  }

  /** Создать колоду */
  public async createDeck(param: CreateDeckDto): Promise<Deck> {
    const normalizedPrice = Math.max(0, param.priceRub ?? 0);
    const deck = await this.deckRepository.create({
      ...param,
      isPaid: normalizedPrice > 0,
      priceRub: normalizedPrice,
    });

    if (!deck) throw new ApiError(400, 'DECK_NOT_CREATED');
    return await this.toDeckView(deck, null);
  }

  /** Обновить колоду */
  public async updateDeck(param: UpdateDeckDto): Promise<Deck> {
    const currentDeck = await this.deckRepository.findById(param.id);
    if (!currentDeck) {
      throw new ApiError(404, 'DECK_NOT_FOUND');
    }

    const normalizedPrice = Math.max(0, param.priceRub ?? currentDeck.priceRub ?? 0);
    const updatedDeck = await this.deckRepository.updateById({
      ...param,
      isPaid: normalizedPrice > 0,
      priceRub: normalizedPrice,
    });

    if (!updatedDeck) {
      throw new ApiError(404, 'DECK_NOT_FOUND');
    }

    return await this.toDeckView(updatedDeck, null);
  }

  /** Удалить колоду */
  public async deleteDeck(param: DeleteDeckDto): Promise<Deck> {
    const deletedDeck = await this.deckRepository.deleteById(param.id);

    if (!deletedDeck) {
      throw new ApiError(404, 'DECK_NOT_FOUND');
    }

    return await this.toDeckView(deletedDeck, null);
  }

  public async createDeckPurchase(param: {
    deckId: string;
    telegramId: string;
  }): Promise<{ paymentId: string; confirmationUrl: string; alreadyPurchased: boolean }> {
    const deck = await this.deckRepository.findById(param.deckId);

    if (!deck) {
      throw new ApiError(404, 'DECK_NOT_FOUND');
    }

    if ((deck.priceRub ?? 0) <= 0) {
      return {
        paymentId: '',
        confirmationUrl: '',
        alreadyPurchased: true,
      };
    }

    const deckId = this.resolveDeckId(deck);

    if (await this.deckPurchaseRepository.isPurchased(deckId, param.telegramId)) {
      return {
        paymentId: '',
        confirmationUrl: '',
        alreadyPurchased: true,
      };
    }

    const baseReturnUrl = env.YOOKASSA_RETURN_URL;
    if (!baseReturnUrl) {
      throw new ApiError(500, 'YOOKASSA_RETURN_URL_NOT_CONFIGURED');
    }

    const url = new URL(baseReturnUrl);
    url.searchParams.set('deckId', deckId);

    const result = await this.yooKassaService.createPayment({
      amountRub: deck.priceRub ?? 0,
      description: `Покупка колоды "${deck.name}"`,
      returnUrl: url.toString(),
        metadata: {
        deckId,
        telegramId: param.telegramId,
      },
    });

    return {
      ...result,
      alreadyPurchased: false,
    };
  }

  public async confirmDeckPurchase(param: {
    deckId: string;
    telegramId: string;
    paymentId: string;
  }): Promise<{ purchased: boolean }> {
    const payment = await this.yooKassaService.getPayment(param.paymentId);
    const metadataDeckId = payment.metadata?.deckId;
    const metadataTelegramId = payment.metadata?.telegramId;

    if (metadataDeckId !== param.deckId || metadataTelegramId !== param.telegramId) {
      throw new ApiError(403, 'PAYMENT_METADATA_MISMATCH');
    }

    if (payment.status !== 'succeeded') {
      return { purchased: false };
    }

    await this.deckPurchaseRepository.markPurchased(param.deckId, param.telegramId);

    const updatedDeck = await this.deckRepository.addPurchaser(param.deckId, param.telegramId);
    if (!updatedDeck) {
      logger.warn(
        { deckId: param.deckId, telegramId: param.telegramId, paymentId: param.paymentId },
        'Payment succeeded, but deck not found when persisting purchase',
      );
    }

    return { purchased: true };
  }
}
