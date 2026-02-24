import axios from "axios";

/** 
 * Запрос токена с backend
*/
export const fetchToken = async (initData: string) => {
  const res = await axios.post('/api/auth/tma', { initData });

  return res.data.payload.token;
};
