import { describe, expect, it } from 'bun:test';
import { UserModel } from '../../../users/user.model';
import { UserRepository } from '../../../users/user.repository';

describe('UserRepository', () => {
  it('findByTelegramId returns lean object', async () => {
    const original = UserModel.findOne;
    (UserModel as unknown as { findOne: unknown }).findOne = (() => ({
      lean: async () => ({ telegramId: '1' }),
    })) as never;

    const repo = new UserRepository();
    const user = await repo.findByTelegramId('1');
    expect(user?.telegramId).toBe('1');

    (UserModel as unknown as { findOne: unknown }).findOne = original;
  });

  it('findByTelegramIds returns users', async () => {
    const original = UserModel.find;
    (UserModel as unknown as { find: unknown }).find = (() => ({
      lean: async () => [{ telegramId: '1' }],
    })) as never;

    const repo = new UserRepository();
    const users = await repo.findByTelegramIds({ telegramIds: ['1'] });
    expect(users.length).toBe(1);

    (UserModel as unknown as { find: unknown }).find = original;
  });

  it('create returns toObject result', async () => {
    const original = UserModel.create;
    (UserModel as unknown as { create: unknown }).create = (async () => ({
      toObject: () => ({ telegramId: '1' }),
    })) as never;

    const repo = new UserRepository();
    const user = await repo.create({ telegramId: '1', nickname: 'u' });
    expect(user.telegramId).toBe('1');

    (UserModel as unknown as { create: unknown }).create = original;
  });

  it('updateByTelegramId returns updated', async () => {
    const original = UserModel.findOneAndUpdate;
    (UserModel as unknown as { findOneAndUpdate: unknown }).findOneAndUpdate = (() => ({
      lean: async () => ({ telegramId: '1' }),
    })) as never;

    const repo = new UserRepository();
    const user = await repo.updateByTelegramId({ telegramId: '1', nickname: 'n' });
    expect(user?.telegramId).toBe('1');

    (UserModel as unknown as { findOneAndUpdate: unknown }).findOneAndUpdate = original;
  });

  it('deleteByTelegramId returns deleted', async () => {
    const original = UserModel.findOneAndDelete;
    (UserModel as unknown as { findOneAndDelete: unknown }).findOneAndDelete = (() => ({
      lean: async () => ({ telegramId: '1' }),
    })) as never;

    const repo = new UserRepository();
    const user = await repo.deleteByTelegramId('1');
    expect(user?.telegramId).toBe('1');

    (UserModel as unknown as { findOneAndDelete: unknown }).findOneAndDelete = original;
  });
});
