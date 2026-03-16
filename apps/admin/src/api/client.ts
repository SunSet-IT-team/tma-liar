import axios from 'axios';
import { ADMIN_STATIC_TOKEN } from '../auth';

export const api = axios.create({ baseURL: '' });

api.interceptors.request.use((config) => {
  config.headers['x-admin-token'] = ADMIN_STATIC_TOKEN;
  return config;
});

export type ApiEnvelope<T> = {
  status: 'success' | 'error';
  payload: T;
  errorCode?: string;
  message?: string;
};
