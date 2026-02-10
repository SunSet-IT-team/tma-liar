import { isValidObjectId, type ObjectId } from "mongoose";
import z from "zod";

/**
 * Cущность 'Пользователь'
 */
export interface User {
  nickname: string;
  telegramId: string;
  profileImg?: string;
  passwordHash?: string;
  token?: string;
}

/**Схема сущности "Пользователь" */
export const UserSchema = z.object({
  id: z.string().nonempty().refine(val => isValidObjectId(val), {
    message: "USER_ID_NOT_SET"
  }),
  nickname: z.string(), 
  telegramId: z.string(),
  profileImg: z.string().optional(),
  passwordHash: z.string().optional(),
  token: z.string().optional(),
})