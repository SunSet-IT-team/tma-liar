import axios from "axios";

/** 
 * Запрос на получение пользователя
*/
export const getUser = async (telegramId: string) => {
  const res = await axios.get(
    `/api/users/${telegramId}`
  );

  return res.data.payload;
};