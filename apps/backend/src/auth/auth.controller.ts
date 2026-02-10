import type { Request, Response, Router } from 'express';
import { success } from '../common/response';
import { UserAuth } from './auth.service';
import { UserApi } from '../users/user.service';
import { AuthLoginDto } from './auth.login.dto';
import { validateLoginTelegramId } from './auth.validator';

const userAuth = new UserAuth(new UserApi());

/**
 * Класс контроллеров авторизации
 */
export class AuthController { 
  /**
   * Контроллер логина
   */
  public async getAuthTelegram(req: Request, res: Response) {
    const telegramId = validateLoginTelegramId(req.params.telegramId); 

    const authDto = new AuthLoginDto(telegramId);
            
    const token = await userAuth.userLogin({ telegramId: authDto.telegramId });
    
    return res.status(200).json(success({ token }));
  }
}