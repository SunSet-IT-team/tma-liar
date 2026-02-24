import axios from "axios";

/** 
 * Запрос токена с backend
*/
export const fetchToken = async (telegramId: string) => {
  const res = await axios.get(
    `http://localhost:3000/api/auth/${telegramId}`
  );

  return res.data.payload.token;
};