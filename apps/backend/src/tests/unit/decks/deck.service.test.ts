import { describe, expect, it, mock } from 'bun:test';
import { ApiError } from '../../../common/response';
import { DeckService } from '../../../decks/deck.service';

describe('DeckService', () => {
  it('findDeck returns deck', async () => {
    const repo = { findById: mock(async () => ({ id: 'd1' })) };
    const service = new DeckService(repo as never);
    const deck = await service.findDeck({ id: 'd1' });
    expect(deck.id).toBe('d1');
  });

  it('findDeck returns mock deck when db miss and mock id is requested', async () => {
    const repo = { findById: mock(async () => null) };
    const service = new DeckService(repo as never);

    const deck = await service.findDeck({ id: 'mock-deck-1' });
    expect(deck.id).toBe('mock-deck-1');
  });

  it('findDeck throws when missing in db and mocks', async () => {
    const repo = { findById: mock(async () => null) };
    const service = new DeckService(repo as never);
    await expect(service.findDeck({ id: 'd1' })).rejects.toBeInstanceOf(ApiError);
  });

  it('findDecks returns list', async () => {
    const repo = { findAll: mock(async () => [{ id: 'd1' }]) };
    const service = new DeckService(repo as never);
    const decks = await service.findDecks();
    expect(decks.length).toBe(1);
  });

  it('findDecks returns mock decks when db is empty', async () => {
    const repo = { findAll: mock(async () => []) };
    const service = new DeckService(repo as never);
    const decks = await service.findDecks();
    expect(decks.length).toBeGreaterThan(0);
    expect(decks[0]?.id).toContain('mock-deck-');
  });

  it('createDeck returns created deck', async () => {
    const repo = {
      create: mock(async () => ({ id: 'd1' })),
    };
    const service = new DeckService(repo as never);
    const deck = await service.createDeck({ name: 'Deck', cover: 'img', questionsCount: 1, questions: [] });
    expect(deck.id).toBe('d1');
  });

  it('createDeck throws when create fails', async () => {
    const repo = {
      create: mock(async () => null),
    };
    const service = new DeckService(repo as never);
    await expect(service.createDeck({ name: 'Deck', cover: 'img', questionsCount: 1, questions: [] })).rejects.toBeInstanceOf(ApiError);
  });

  it('updateDeck returns updated deck', async () => {
    const repo = {
      updateById: mock(async () => ({ id: 'd1' })),
    };
    const service = new DeckService(repo as never);
    const deck = await service.updateDeck({ id: 'd1', name: 'Deck2' });
    expect(deck.id).toBe('d1');
  });

  it('updateDeck throws when not found', async () => {
    const repo = {
      updateById: mock(async () => null),
    };
    const service = new DeckService(repo as never);
    await expect(service.updateDeck({ id: 'd1', name: 'Deck2' })).rejects.toBeInstanceOf(ApiError);
  });

  it('deleteDeck returns deleted deck', async () => {
    const repo = {
      deleteById: mock(async () => ({ id: 'd1' })),
    };
    const service = new DeckService(repo as never);
    const deck = await service.deleteDeck({ id: 'd1' });
    expect(deck.id).toBe('d1');
  });

  it('deleteDeck throws when not found', async () => {
    const repo = {
      deleteById: mock(async () => null),
    };
    const service = new DeckService(repo as never);
    await expect(service.deleteDeck({ id: 'd1' })).rejects.toBeInstanceOf(ApiError);
  });
});
