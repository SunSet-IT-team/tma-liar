import { useState, useCallback } from 'react';
import { api, type ApiEnvelope } from '../api/client';
import type { AxiosRequestConfig } from 'axios';

function readError(error: unknown): string {
  const maybeAxios = error as { response?: { data?: unknown }; message?: string };
  const maybeEnvelope = maybeAxios.response?.data as
    | { errorCode?: string; message?: string }
    | undefined;

  if (maybeEnvelope?.errorCode) return maybeEnvelope.errorCode;
  if (maybeEnvelope?.message) return maybeEnvelope.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Неизвестная ошибка';
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async <T>(config: AxiosRequestConfig): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.request<ApiEnvelope<T>>(config);
        return res.data.payload;
      } catch (err) {
        const message = readError(err);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { request, loading, error, clearError };
}
