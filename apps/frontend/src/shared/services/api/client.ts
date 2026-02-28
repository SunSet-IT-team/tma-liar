import axios from 'axios';
import { authService } from '../auth.service';
import { getCurrentTmaUser } from '../../lib/tma/user';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
});

apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  const user = getCurrentTmaUser();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (user.telegramId) {
    config.headers['x-dev-user-id'] = user.telegramId;
  }

  return config;
});
