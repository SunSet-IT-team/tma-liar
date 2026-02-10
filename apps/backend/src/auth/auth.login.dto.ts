/**
 * DTO для авторизации
 * @param telegramId Телеграм ID для логина
 */
export class AuthLoginDto { 
  /**
   * Телеграм ID для логина
   */
  telegramId: string;

  constructor(telegramId: string) {
    this.telegramId = telegramId;
  }
}