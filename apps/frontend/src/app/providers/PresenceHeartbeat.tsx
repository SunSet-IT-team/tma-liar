import { useContext, useEffect } from 'react';
import { AuthContext } from './Auth/AuthProvider';
import { postGuestPresence } from '../../shared/services/api/presence.api';
import { postPresence } from '../../shared/services/api/user.api';
import { getCurrentUser, isGuestUser } from '../../shared/lib/tma/user';

const INTERVAL_MS = 45_000;

/**
 * Периодически сообщает серверу, что пользователь на сайте (аналитика «активных сейчас»).
 * Учитываются и авторизованные пользователи, и гости (режим без Telegram / без токена).
 */
export function PresenceHeartbeat() {
  const { isAuth, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (isLoading) return;

    if (isAuth) {
      void postPresence().catch(() => {});
      const id = window.setInterval(() => {
        void postPresence().catch(() => {});
      }, INTERVAL_MS);
      return () => window.clearInterval(id);
    }

    const user = getCurrentUser();
    if (!isGuestUser(user)) return;

    const ping = () =>
      postGuestPresence({
        guestId: user.telegramId,
        nickname: user.nickname,
      }).catch(() => {});

    void ping();
    const id = window.setInterval(ping, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isAuth, isLoading]);

  return null;
}
