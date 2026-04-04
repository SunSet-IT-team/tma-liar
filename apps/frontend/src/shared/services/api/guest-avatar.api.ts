import { apiClient } from './client';

type GuestAvatarResponse = {
  payload: { profileImg: string };
};

/**
 * Загрузка аватара гостя на сервер (файл в uploads/guest-avatars, путь в ответе).
 * Требует совпадения guestId с заголовком x-dev-user-id (как у остальных запросов).
 */
export async function uploadGuestAvatarFile(guestId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('guestId', guestId);
  formData.append('profileImgFile', file);

  const response = await apiClient.post<GuestAvatarResponse>('/api/guest-avatar', formData);
  return response.data.payload?.profileImg ?? '';
}
