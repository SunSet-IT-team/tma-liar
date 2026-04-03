import { apiClient } from './client';

/**
 * Heartbeat гостя (guest_*) для админ-аналитики; без JWT.
 */
export async function postGuestPresence(payload: {
  guestId: string;
  nickname: string;
}): Promise<void> {
  await apiClient.post('/api/presence/guest', payload);
}
