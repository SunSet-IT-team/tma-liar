import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { ApiError, success } from "../common/response";
import { AuthLoginDtoSchema, type AuthLoginDto } from "./dtos/auth-login.dto";

/**
 * Класс контроллеров авторизации
 */
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Контроллер логина через Telegram Mini App initData
   */
  loginWithTma = async (req: Request, res: Response) => {
    const result = AuthLoginDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(400, "LOGIN_DATA_INVALID");
    }

    const dto: AuthLoginDto = result.data;
    const token = await this.authService.login(dto);

    return res.status(200).json(success({ token }));
  };
}
