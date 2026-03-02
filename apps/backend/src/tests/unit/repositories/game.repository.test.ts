import { describe, expect, it } from 'bun:test';
import { GameRepository } from '../../../game/game.repository';
import { GameModel } from '../../../game/game.model';

describe('GameRepository', () => {
  it('startSession delegates to model', async () => {
    const original = GameModel.startSession;
    (GameModel as any).startSession = async () => 'session';

    const repo = new GameRepository();
    const session = await repo.startSession();
    expect(session).toBeString();

    (GameModel as any).startSession = original;
  });

  it('findByIdLean returns lean document', async () => {
    const original = GameModel.findById;
    (GameModel as any).findById = () => ({ lean: async () => ({ id: 'g1' }) });

    const repo = new GameRepository();
    const game = await repo.findByIdLean('g1');
    expect(game?.id).toBe('g1');

    (GameModel as any).findById = original;
  });

  it('findByIdDocument returns query result', async () => {
    const original = GameModel.findById;
    (GameModel as any).findById = () => ({ id: 'g1' });

    const repo = new GameRepository();
    const game = repo.findByIdDocument('g1') as any;
    expect(game.id).toBe('g1');

    (GameModel as any).findById = original;
  });

  it('createForLobby returns created object and throws if create returns empty', async () => {
    const original = GameModel.create;
    (GameModel as any).create = async () => [{ toObject: () => ({ id: 'g1' }) }];

    const repo = new GameRepository();
    const game = await repo.createForLobby('L1', [], { deck: { questions: [] } } as any);
    expect(game.id).toBe('g1');

    (GameModel as any).create = async () => [];
    await expect(repo.createForLobby('L1', [], { deck: { questions: [] } } as any)).rejects.toBeInstanceOf(Error);

    (GameModel as any).create = original;
  });
});
