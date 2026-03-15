import { apiClient } from './client';

type UserResponse = {
  payload: {
    id: string;
    telegramId: string;
    nickname: string;
    profileImg?: string;
  };
};

type UpdateUserResponse = UserResponse;

/**
 * Получение пользователя по telegramId
 */
export const findUserByTelegramId = async (telegramId: string) => {
  const response = await apiClient.get<UserResponse>(`/api/users/${telegramId}`);
  return response.data.payload;
};

/**
 * Обновление фото профиля пользователя
 */
export const updateUserProfileImg = async (telegramId: string, profileImg: string) => {
  const response = await apiClient.put<UpdateUserResponse>(`/api/users/${telegramId}`, {
    profileImg,
  });
  return response.data.payload;
};

/**
 * Обновление никнейма пользователя
 */
export const updateUserNickname = async (telegramId: string, nickname: string) => {
  const response = await apiClient.put<UpdateUserResponse>(`/api/users/${telegramId}`, {
    nickname,
  });
  return response.data.payload;
};

/**
 * Обновление фото профиля пользователя через multipart/form-data
 */
export const updateUserProfileImgFile = async (telegramId: string, file: File) => {
  const formData = new FormData();
  formData.append('profileImgFile', file);

  const response = await apiClient.put<UpdateUserResponse>(`/api/users/${telegramId}`, formData);
  return response.data.payload;
};
