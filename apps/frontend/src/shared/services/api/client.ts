import axios from 'axios';
import { authService } from '../auth.service';
import { getCurrentUser } from '../../lib/tma/user';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
});

if (import.meta.env.DEV) {
  apiClient.interceptors.request.use((config) => {
    console.log('[api:req]', (config.method ?? 'get').toUpperCase(), config.url, config.data ?? null);
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => {
      console.log(
        '[api:res]',
        response.status,
        response.config.url,
        response.data ?? null,
      );
      return response;
    },
    (error) => {
      const status = error?.response?.status ?? 'NETWORK';
      const url = error?.config?.url ?? 'unknown';
      const data = error?.response?.data ?? null;
      console.error('[api:err]', status, url, data);
      return Promise.reject(error);
    },
  );
}

apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  const user = getCurrentUser();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const userId = user.id ?? user.telegramId;
  if (userId) {
    config.headers['x-dev-user-id'] = userId;
  }

  return config;
});
