import jwt from "jsonwebtoken";
import type { AuthLoginDto } from "./dtos/auth-login.dto";
import { ApiError } from "../common/response";
import { UserModel } from "../users/user.modal";
import { TelegramAuthService } from './telegram-auth.service';

const SECRET = process.env.SECRET ?? "super-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1d";

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
  constructor(private telegramAuthService: TelegramAuthService = new TelegramAuthService()) {}

  public async login(param: AuthLoginDto): Promise<string> {
    const telegramUser = this.telegramAuthService.getValidatedUser(param.initData);

    let user = await UserModel.findOne({ telegramId: telegramUser.telegramId });

    if (!user) {
      user = await UserModel.create({
        telegramId: telegramUser.telegramId,
        nickname: telegramUser.nickname,
        profileImg: telegramUser.profileImg,
      });
    }

    const token = jwt.sign(
      { sub: user.id, userId: user.id },
      SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    if (!token) throw new ApiError(401, "AUTH_FAILED");

    return token;
  }
}
