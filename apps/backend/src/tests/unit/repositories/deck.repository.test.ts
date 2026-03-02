import { describe, expect, it } from 'bun:test';
import { DeckModel } from '../../../decks/deck.model';
import { DeckRepository } from '../../../decks/deck.repository';

describe('DeckRepository', () => {
  it('findById returns deck', async () => {
    const original = DeckModel.findOne;
    (DeckModel as unknown as { findOne: unknown }).findOne = (() => ({
      lean: async () => ({ id: 'd1' }),
    })) as never;

    const repo = new DeckRepository();
    const deck = await repo.findById('d1');
    expect(deck?.id).toBe('d1');

    (DeckModel as unknown as { findOne: unknown }).findOne = original;
  });

  it('findAll returns list', async () => {
    const original = DeckModel.find;
    (DeckModel as unknown as { find: unknown }).find = (() => ({
      lean: async () => [{ id: 'd1' }],
    })) as never;

    const repo = new DeckRepository();
    const decks = await repo.findAll();
    expect(decks.length).toBe(1);

    (DeckModel as unknown as { find: unknown }).find = original;
  });

  it('create returns toObject result', async () => {
    const original = DeckModel.create;
    (DeckModel as unknown as { create: unknown }).create = (async () => ({
      toObject: () => ({ id: 'd1' }),
    })) as never;

    const repo = new DeckRepository();
    const deck = await repo.create({ name: 'Deck', cover: 'img', questionsCount: 1, questions: [] });
    expect(deck.id).toBe('d1');

    (DeckModel as unknown as { create: unknown }).create = original;
  });

  it('updateById returns updated', async () => {
    const original = DeckModel.findOneAndUpdate;
    (DeckModel as unknown as { findOneAndUpdate: unknown }).findOneAndUpdate = (() => ({
      lean: async () => ({ id: 'd1' }),
    })) as never;

    const repo = new DeckRepository();
    const deck = await repo.updateById({ id: 'd1', name: 'Deck2' });
    expect(deck?.id).toBe('d1');

    (DeckModel as unknown as { findOneAndUpdate: unknown }).findOneAndUpdate = original;
  });

  it('deleteById returns deleted', async () => {
    const original = DeckModel.findOneAndDelete;
    (DeckModel as unknown as { findOneAndDelete: unknown }).findOneAndDelete = (() => ({
      lean: async () => ({ id: 'd1' }),
    })) as never;

    const repo = new DeckRepository();
    const deck = await repo.deleteById('d1');
    expect(deck?.id).toBe('d1');

    (DeckModel as unknown as { findOneAndDelete: unknown }).findOneAndDelete = original;
  });
});
