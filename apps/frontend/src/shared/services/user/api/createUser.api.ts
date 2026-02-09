import axios from 'axios';

/** 
 * Запрос на регистрацию пользователя
*/
export const createUser = async (telegramId: string, nickname?: string) => {
  return axios.post('/api/users', {
    telegramId,
    nickname,
  });
};