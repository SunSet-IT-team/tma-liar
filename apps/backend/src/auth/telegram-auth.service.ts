import { parse, validate } from '@tma.js/init-data-node';
import { ApiError } from '../common/response';
import { env } from '../config/env';

export type TelegramAuthUser = {
  telegramId: string;
  nickname: string;
  profileImg?: string;
};

export class TelegramAuthService {
  public getValidatedUser(initData: string): TelegramAuthUser {
    try {
      validate(initData, env.TELEGRAM_BOT_TOKEN, {
        expiresIn: env.TELEGRAM_INITDATA_EXPIRES_IN,
      });
    } catch {
      throw new ApiError(401, 'INIT_DATA_INVALID');
    }

    const parsed = parse(initData);
    const telegramUser = parsed.user;

    if (!telegramUser?.id) {
      throw new ApiError(422, 'TELEGRAM_USER_NOT_FOUND');
    }

    const telegramId = String(telegramUser.id);
    const fallbackNickname = [telegramUser.first_name, telegramUser.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      telegramId,
      nickname: telegramUser.username ?? fallbackNickname ?? `user_${telegramId}`,
      profileImg: telegramUser.photo_url,
    };
  }
}
