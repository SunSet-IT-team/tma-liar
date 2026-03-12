import { apiClient } from './client';

type AuthResponse = {
  payload: {
    token: string;
  };
};

/**
 * Запрос токена с backend
 */
export const fetchToken = async (initData: string) => {
  const response = await apiClient.post<AuthResponse>('/api/auth/tma', { initData });
  return response.data.payload.token;
};
