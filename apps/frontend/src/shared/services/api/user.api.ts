import { apiClient } from './client';

type UserResponse = {
  payload: {
    id: string;
    telegramId: string;
    nickname: string;
    profileImg?: string;
  };
};

/**
 * Получение пользователя по telegramId
 */
export const findUserByTelegramId = async (telegramId: string) => {
  const response = await apiClient.get<UserResponse>(`/api/users/${telegramId}`);
  return response.data.payload;
};
