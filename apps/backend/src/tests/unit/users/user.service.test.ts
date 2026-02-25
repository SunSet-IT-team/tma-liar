import { describe, expect, it, mock } from 'bun:test';
import { ApiError } from '../../../common/response';
import { UserService } from '../../../users/user.service';

describe('UserService', () => {
  it('findUser returns user', async () => {
    const repo = { findByTelegramId: mock(async () => ({ telegramId: '1' })) };
    const service = new UserService(repo as never);
    const user = await service.findUser({ telegramId: '1' });
    expect(user.telegramId).toBe('1');
  });

  it('findUser throws when not found', async () => {
    const repo = { findByTelegramId: mock(async () => null) };
    const service = new UserService(repo as never);
    await expect(service.findUser({ telegramId: '1' })).rejects.toBeInstanceOf(ApiError);
  });

  it('findUsers returns users', async () => {
    const repo = { findByTelegramIds: mock(async () => [{ telegramId: '1' }]) };
    const service = new UserService(repo as never);
    const users = await service.findUsers({ telegramIds: ['1'] });
    expect(users.length).toBe(1);
  });

  it('findUsers throws when empty', async () => {
    const repo = { findByTelegramIds: mock(async () => []) };
    const service = new UserService(repo as never);
    await expect(service.findUsers({ telegramIds: ['1'] })).rejects.toBeInstanceOf(ApiError);
  });

  it('createUser returns created user', async () => {
    const repo = { create: mock(async () => ({ telegramId: '1' })) };
    const service = new UserService(repo as never);
    const user = await service.createUser({ telegramId: '1', nickname: 'u' });
    expect(user.telegramId).toBe('1');
  });

  it('createUser throws when repo returns null', async () => {
    const repo = { create: mock(async () => null) };
    const service = new UserService(repo as never);
    await expect(service.createUser({ telegramId: '1', nickname: 'u' })).rejects.toBeInstanceOf(ApiError);
  });

  it('updateUser returns updated user', async () => {
    const repo = { updateByTelegramId: mock(async () => ({ telegramId: '1' })) };
    const service = new UserService(repo as never);
    const user = await service.updateUser({ telegramId: '1', nickname: 'n' });
    expect(user.telegramId).toBe('1');
  });

  it('updateUser throws when not found', async () => {
    const repo = { updateByTelegramId: mock(async () => null) };
    const service = new UserService(repo as never);
    await expect(service.updateUser({ telegramId: '1', nickname: 'n' })).rejects.toBeInstanceOf(ApiError);
  });

  it('deleteUser returns deleted user', async () => {
    const repo = { deleteByTelegramId: mock(async () => ({ telegramId: '1' })) };
    const service = new UserService(repo as never);
    const user = await service.deleteUser({ telegramId: '1' });
    expect(user.telegramId).toBe('1');
  });

  it('deleteUser throws when not found', async () => {
    const repo = { deleteByTelegramId: mock(async () => null) };
    const service = new UserService(repo as never);
    await expect(service.deleteUser({ telegramId: '1' })).rejects.toBeInstanceOf(ApiError);
  });
});
