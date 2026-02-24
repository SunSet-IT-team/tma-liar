import jwt from "jsonwebtoken";
import { UserService } from "../users/user.service";
import type { AuthLoginDto } from "./dtos/auth-login.dto";
import { ApiError } from "../common/response";
import { UserModel } from "../users/user.modal";

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
  constructor(private users: UserService) {}

  public async login(param: AuthLoginDto): Promise<string> {
    const user = await UserModel.findOne({ telegramId: param.telegramId });

    if (!user) throw new ApiError(400, "USER_NOT_REGISTERED");

    const token = jwt.sign(
      { userId: user.id },
      SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    if (!token) throw new ApiError(401, "AUTH_FAILED");

    return token;
  }
}
