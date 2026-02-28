import jwt from "jsonwebtoken";
import type { AuthLoginDto } from "./dtos/auth-login.dto";
import { ApiError } from "../common/response";
import { TelegramAuthService } from './telegram-auth.service';
import { env } from "../config/env";
import { UserRepository } from "../users/user.repository";

/*
 * Интерфейс для сервиса авторизации
 */
export interface AuthServiceMethods {
  login: (param: AuthLoginDto) => Promise<string>;
}

/**
 * Сервис авторизации
 */
export class AuthService implements AuthServiceMethods {
  constructor(
    private telegramAuthService: TelegramAuthService = new TelegramAuthService(),
    private userRepository: UserRepository = new UserRepository(),
  ) {}

  public async login(param: AuthLoginDto): Promise<string> {
    const telegramUser = this.telegramAuthService.getValidatedUser(param.initData);

    let user = await this.userRepository.findByTelegramId(telegramUser.telegramId);

    if (!user) {
      try {
        user = await this.userRepository.create({
          telegramId: telegramUser.telegramId,
          nickname: telegramUser.nickname,
          profileImg: telegramUser.profileImg,
        });
      } catch (error) {
        // Concurrent auth requests may race on unique telegramId index.
        const isDuplicateKeyError =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: number }).code === 11000;

        if (!isDuplicateKeyError) {
          throw error;
        }

        user = await this.userRepository.findByTelegramId(telegramUser.telegramId);
        if (!user) {
          throw new ApiError(409, 'USER_CREATE_CONFLICT');
        }
      }
    }

    const userId = this.resolveUserId(user);

    if (!userId) {
      throw new ApiError(500, 'AUTH_USER_ID_NOT_FOUND');
    }

    const token = jwt.sign(
      { sub: userId, userId },
      env.SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    if (!token) throw new ApiError(401, "AUTH_FAILED");

    return token;
  }

  private resolveUserId(user: { id?: string; _id?: unknown }): string | null {
    if (user.id && typeof user.id === 'string') {
      return user.id;
    }

    if (typeof user._id === 'string') {
      return user._id;
    }

    if (user._id && typeof user._id === 'object' && 'toString' in user._id) {
      const asString = (user._id as { toString: () => string }).toString();
      return asString || null;
    }

    return null;
  }
}
