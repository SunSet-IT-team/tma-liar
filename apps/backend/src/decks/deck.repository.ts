import { DeckModel } from './deck.model';
import type { Deck } from './entities/deck.entity';
import type { CreateDeckDto } from './dtos/deck-create.dto';
import type { UpdateDeckDto } from './dtos/deck-update.dto';
import { isValidObjectId } from 'mongoose';

type DeckLeanLike = Deck & { _id?: unknown };

function normalizeDeckId(deck: DeckLeanLike | null): Deck | null {
  if (!deck) return null;
  const rawId = deck._id ?? deck.id;
  const id =
    typeof rawId === 'string'
      ? rawId
      : rawId && typeof rawId === 'object' && 'toString' in rawId
        ? (rawId as { toString: () => string }).toString()
        : '';

  return {
    ...(deck as Deck),
    id,
  };
}

export class DeckRepository {
  public async findById(id: string): Promise<Deck | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    const deck = await DeckModel.findOne({ _id: id }).lean();
    return normalizeDeckId(deck as DeckLeanLike | null);
  }

  public async findAll(): Promise<Deck[]> {
    const decks = await DeckModel.find().lean();
    return decks
      .map((deck) => normalizeDeckId(deck as DeckLeanLike))
      .filter((deck): deck is Deck => deck !== null);
  }

  public async create(dto: CreateDeckDto): Promise<Deck> {
    const deck = await DeckModel.create(dto);
    return deck.toObject();
  }

  public async updateById(dto: UpdateDeckDto): Promise<Deck | null> {
    const { id, ...updateFields } = dto;
    const updatedDeck = await DeckModel.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { new: true }
    ).lean();

    return normalizeDeckId(updatedDeck as DeckLeanLike | null);
  }

  public async deleteById(id: string): Promise<Deck | null> {
    const deletedDeck = await DeckModel.findOneAndDelete({ _id: id }).lean();
    return normalizeDeckId(deletedDeck as DeckLeanLike | null);
  }

  public async addPurchaser(deckId: string, telegramId: string): Promise<Deck | null> {
    const updatedDeck = await DeckModel.findOneAndUpdate(
      { _id: deckId },
      { $addToSet: { purchasedBy: telegramId } },
      { new: true },
    ).lean();

    return normalizeDeckId(updatedDeck as DeckLeanLike | null);
  }
}
