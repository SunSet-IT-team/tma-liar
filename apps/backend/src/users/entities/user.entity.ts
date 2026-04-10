import { isValidObjectId, type ObjectId } from "mongoose";
import z from "zod";

/**
 * Cущность 'Пользователь'
 */
export interface User {
  id: string;
  nickname: string;
  telegramId: string;
  profileImg?: string;
  passwordHash?: string;
  token?: string;
  /** Последняя отметка активности клиента (heartbeat), если включена аналитика присутствия */
  lastActiveAt?: Date;
  balanceRub?: number;
  subscriptionUntil?: Date;
}

/** Поля пользователя, отдаваемые клиенту (профиль / me). */
export type PublicUserProfile = {
  id: string;
  nickname: string;
  telegramId: string;
  profileImg?: string;
  lastActiveAt?: Date;
  balanceRub: number;
  subscriptionUntil: string | null;
  hasActiveSubscription: boolean;
};

/**Схема сущности "Пользователь" */
export const UserSchema = z.object({
  id: z.string(),
  nickname: z.string(), 
  telegramId: z.string(),
  profileImg: z.string().optional(),
  passwordHash: z.string().optional(),
  token: z.string().optional(),
  balanceRub: z.number().optional(),
  subscriptionUntil: z.coerce.date().optional(),
})