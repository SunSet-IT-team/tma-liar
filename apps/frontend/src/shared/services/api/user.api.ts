import { apiClient } from './client';
import { setCachedServerUser } from '../../lib/tma/user';

type UserPayload = {
  id: string;
  telegramId: string;
  nickname: string;
  profileImg?: string;
};

type UserResponse = {
  payload: UserPayload;
};

type UpdateUserResponse = UserResponse;

/**
 * Текущий пользователь по auth (источник правды — сервер). Для гостей — 404.
 */
export const getMe = async (): Promise<UserPayload | null> => {
  try {
    const response = await apiClient.get<UserResponse>('/api/users/me');
    const user = response.data.payload;
    console.log('getMe')
    console.log(user)
    if (user?.telegramId) {
      const id = user.id ?? user.telegramId;
      setCachedServerUser({
        id,
        telegramId: user.telegramId,
        nickname: user.nickname,
        profileImg: user.profileImg,
      });
      return { ...user, id };
    }
    return null;
  } catch {
    return null;
  }
};

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
