import { Types } from "mongoose";

/**
 * Cущность 'Пользователь'
 */
export interface User {
  _id: Types.ObjectId;
  nickname: string;
  telegramId: string;
  profileImg?: string;
  passwordHash?: string;
  token?: string;
}
