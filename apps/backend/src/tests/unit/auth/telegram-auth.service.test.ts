import { describe, expect, it } from 'bun:test';
import { sign } from '@tma.js/init-data-node';
import { ApiError } from '../../../common/response';
import { TelegramAuthService } from '../../../auth/telegram-auth.service';
import { env } from '../../../config/env';

describe('TelegramAuthService initData validation', () => {
  const service = new TelegramAuthService();

  it('returns parsed user for valid initData', () => {
    const initData = sign(
      {
        user: {
          id: 111111,
          first_name: 'Vlad',
          username: 'vlad_test',
          photo_url: 'https://example.com/avatar.png',
        },
      },
      env.TELEGRAM_BOT_TOKEN,
      new Date(),
    );

    const user = service.getValidatedUser(initData);

    expect(user.telegramId).toBe('111111');
    expect(user.nickname).toBe('vlad_test');
    expect(user.profileImg).toBe('https://example.com/avatar.png');
  });

  it('throws INIT_DATA_INVALID for tampered initData', () => {
    const validInitData = sign(
      {
        user: {
          id: 222222,
          first_name: 'Tampered',
        },
      },
      env.TELEGRAM_BOT_TOKEN,
      new Date(),
    );

    expect(() => service.getValidatedUser(`${validInitData}x`)).toThrowError(ApiError);

    try {
      service.getValidatedUser(`${validInitData}x`);
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.code).toBe(401);
      expect(apiError.errorCode).toBe('INIT_DATA_INVALID');
    }
  });

  it('throws INIT_DATA_INVALID for expired initData', () => {
    const oldDate = new Date(Date.now() - (env.TELEGRAM_INITDATA_EXPIRES_IN + 10) * 1000);
    const expiredInitData = sign(
      {
        user: {
          id: 333333,
          first_name: 'Expired',
        },
      },
      env.TELEGRAM_BOT_TOKEN,
      oldDate,
    );

    expect(() => service.getValidatedUser(expiredInitData)).toThrowError(ApiError);

    try {
      service.getValidatedUser(expiredInitData);
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.code).toBe(401);
      expect(apiError.errorCode).toBe('INIT_DATA_INVALID');
    }
  });
});
