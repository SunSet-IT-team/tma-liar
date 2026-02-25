import { parse, validate } from '@tma.js/init-data-node';
import { ApiError } from '../common/response';

export type TelegramAuthUser = {
  telegramId: string;
  nickname: string;
  profileImg?: string;
};

export class TelegramAuthService {
  public getValidatedUser(initData: string): TelegramAuthUser {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
    const telegramInitDataExpiresIn = parseInt(
      process.env.TELEGRAM_INITDATA_EXPIRES_IN ?? '3600',
      10,
    );

    if (!telegramBotToken) {
      throw new ApiError(500, 'INTERNAL_SERVER_ERROR');
    }

    try {
      validate(initData, telegramBotToken, {
        expiresIn: telegramInitDataExpiresIn,
      });
    } catch {
      throw new ApiError(401, 'INIT_DATA_INVALID');
    }

    const parsed = parse(initData);
    const telegramUser = parsed.user;

    if (!telegramUser?.id) {
      throw new ApiError(400, 'TELEGRAM_USER_NOT_FOUND');
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
