import { describe, expect, it, mock } from 'bun:test';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../../auth/auth.service';
import { env } from '../../../config/env';

describe('AuthService', () => {
  it('creates user when telegram user does not exist and returns JWT', async () => {
    const telegramUser = {
      telegramId: 'new-telegram-id',
      nickname: 'New User',
      profileImg: 'https://example.com/new-user.png',
    };

    const createdUser = {
      id: 'user-123',
      telegramId: telegramUser.telegramId,
      nickname: telegramUser.nickname,
      profileImg: telegramUser.profileImg,
    };

    const telegramAuthService = {
      getValidatedUser: mock(() => telegramUser),
    };

    const userRepository = {
      findByTelegramId: mock(async () => null),
      create: mock(async () => createdUser),
    };

    const service = new AuthService(telegramAuthService as never, userRepository as never);

    const token = await service.login({ initData: 'valid-init-data' });

    expect(telegramAuthService.getValidatedUser).toHaveBeenCalledTimes(1);
    expect(userRepository.findByTelegramId).toHaveBeenCalledWith(telegramUser.telegramId);
    expect(userRepository.create).toHaveBeenCalledWith({
      telegramId: telegramUser.telegramId,
      nickname: telegramUser.nickname,
      profileImg: telegramUser.profileImg,
    });

    const payload = jwt.verify(token, env.SECRET) as { sub?: string; userId?: string };
    expect(payload.sub).toBe(createdUser.id);
    expect(payload.userId).toBe(createdUser.id);
  });

  it('reuses existing user and does not create duplicate user', async () => {
    const telegramUser = {
      telegramId: 'existing-telegram-id',
      nickname: 'Existing User',
      profileImg: 'https://example.com/existing-user.png',
    };

    const existingUser = {
      id: 'user-999',
      telegramId: telegramUser.telegramId,
      nickname: telegramUser.nickname,
      profileImg: telegramUser.profileImg,
    };

    const telegramAuthService = {
      getValidatedUser: mock(() => telegramUser),
    };

    const userRepository = {
      findByTelegramId: mock(async () => existingUser),
      create: mock(async () => {
        throw new Error('create should not be called for existing user');
      }),
    };

    const service = new AuthService(telegramAuthService as never, userRepository as never);

    const token = await service.login({ initData: 'valid-init-data' });

    expect(userRepository.findByTelegramId).toHaveBeenCalledWith(telegramUser.telegramId);
    expect(userRepository.create).toHaveBeenCalledTimes(0);

    const payload = jwt.verify(token, env.SECRET) as { sub?: string; userId?: string };
    expect(payload.sub).toBe(existingUser.id);
    expect(payload.userId).toBe(existingUser.id);
  });

  it('builds jwt subject from _id when id virtual is absent', async () => {
    const telegramUser = {
      telegramId: 'existing-no-virtual-id',
      nickname: 'Existing User',
      profileImg: 'https://example.com/existing-user.png',
    };

    const existingUser = {
      _id: 'mongo-object-id-like-string',
      telegramId: telegramUser.telegramId,
      nickname: telegramUser.nickname,
      profileImg: telegramUser.profileImg,
    };

    const telegramAuthService = {
      getValidatedUser: mock(() => telegramUser),
    };

    const userRepository = {
      findByTelegramId: mock(async () => existingUser),
      create: mock(async () => {
        throw new Error('create should not be called for existing user');
      }),
    };

    const service = new AuthService(telegramAuthService as never, userRepository as never);

    const token = await service.login({ initData: 'valid-init-data' });
    const payload = jwt.verify(token, env.SECRET) as { sub?: string; userId?: string };

    expect(payload.sub).toBe(existingUser._id);
    expect(payload.userId).toBe(existingUser._id);
  });

  it('handles duplicate-key race on create by re-reading user', async () => {
    const telegramUser = {
      telegramId: 'race-telegram-id',
      nickname: 'Race User',
      profileImg: 'https://example.com/race-user.png',
    };

    const existingUser = {
      id: 'user-race',
      telegramId: telegramUser.telegramId,
      nickname: telegramUser.nickname,
      profileImg: telegramUser.profileImg,
    };

    const telegramAuthService = {
      getValidatedUser: mock(() => telegramUser),
    };

    let findCalls = 0;
    const userRepository = {
      findByTelegramId: mock(async () => {
        findCalls += 1;
        return findCalls === 1 ? null : existingUser;
      }),
      create: mock(async () => {
        throw { code: 11000 };
      }),
    };

    const service = new AuthService(telegramAuthService as never, userRepository as never);

    const token = await service.login({ initData: 'valid-init-data' });

    expect(userRepository.create).toHaveBeenCalledTimes(1);
    expect(userRepository.findByTelegramId).toHaveBeenCalledTimes(2);

    const payload = jwt.verify(token, env.SECRET) as { sub?: string; userId?: string };
    expect(payload.sub).toBe(existingUser.id);
    expect(payload.userId).toBe(existingUser.id);
  });
});
