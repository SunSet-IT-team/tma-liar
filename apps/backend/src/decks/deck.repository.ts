import { DeckModel } from './deck.model';
import type { Deck } from './entities/deck.entity';
import type { CreateDeckDto } from './dtos/deck-create.dto';
import type { UpdateDeckDto } from './dtos/deck-update.dto';

export class DeckRepository {
  public async findById(id: string): Promise<Deck | null> {
    const deck = await DeckModel.findOne({ _id: id }).lean();
    return (deck as Deck | null) ?? null;
  }

  public async findAll(): Promise<Deck[]> {
    const decks = await DeckModel.find().lean();
    return decks as Deck[];
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

    return (updatedDeck as Deck | null) ?? null;
  }

  public async deleteById(id: string): Promise<Deck | null> {
    const deletedDeck = await DeckModel.findOneAndDelete({ _id: id }).lean();
    return (deletedDeck as Deck | null) ?? null;
  }
}

