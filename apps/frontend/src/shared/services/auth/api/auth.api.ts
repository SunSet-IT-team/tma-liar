import axios from "axios";

/** 
 * Запрос токена с backend
*/
export const fetchToken = async (telegramId: string) => {
  const res = await axios.get(
    `/api/auth/${telegramId}`
  );

  return res.data.payload.token;
};