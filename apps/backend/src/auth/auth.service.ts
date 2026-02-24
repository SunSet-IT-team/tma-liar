import { parse, validate } from '@tma.js/init-data-node';
import jwt from "jsonwebtoken";
import type { AuthLoginDto } from "./dtos/auth-login.dto";
import { ApiError } from "../common/response";
import { UserModel } from "../users/user.modal";

const SECRET = process.env.SECRET ?? "super-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1d";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const TELEGRAM_INITDATA_EXPIRES_IN = parseInt(
  process.env.TELEGRAM_INITDATA_EXPIRES_IN ?? '3600',
  10,
);

if (!SECRET) {
  throw new Error("SECRET_UNDEFINED");
}

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
  public async login(param: AuthLoginDto): Promise<string> {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new ApiError(500, 'TELEGRAM_BOT_TOKEN_UNDEFINED');
    }

    try {
      validate(param.initData, TELEGRAM_BOT_TOKEN, {
        expiresIn: TELEGRAM_INITDATA_EXPIRES_IN,
      });
    } catch {
      throw new ApiError(401, 'INIT_DATA_INVALID');
    }

    const parsed = parse(param.initData);
    const telegramUser = parsed.user;

    if (!telegramUser?.id) {
      throw new ApiError(400, 'TELEGRAM_USER_NOT_FOUND');
    }

    const telegramId = String(telegramUser.id);
    const fallbackNickname = [telegramUser.first_name, telegramUser.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    const nickname = telegramUser.username ?? fallbackNickname ?? `user_${telegramId}`;

    let user = await UserModel.findOne({ telegramId });

    if (!user) {
      user = await UserModel.create({
        telegramId,
        nickname,
        profileImg: telegramUser.photo_url,
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    if (!token) throw new ApiError(401, "AUTH_FAILED");

    return token;
  }
}
