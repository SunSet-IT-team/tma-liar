import axios from 'axios';
import type { User } from '../user.service';

/** 
 * Запрос на изменение данных пользователя
*/
export const updateUser = async (telegramId: string, nickname?: string, profileImg?: string) => {
  return axios.put(`/api/users/${telegramId}`, {
    nickname,
    profileImg
  });
};