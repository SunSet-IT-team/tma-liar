import { createContext, useEffect, useState } from 'react';
import { authService } from '../../../shared/services/auth/auth.service';
import { fetchToken } from '../../../shared/services/auth/api/auth.api';
import { createUser } from '../../../shared/services/user/api/createUser.api';
import { getUser } from '../../../shared/services/user/api/getUser.api';
import { userService } from '../../../shared/services/user/user.service';

export const AuthContext = createContext({
  isAuth: false,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const telegramUser = tg?.initDataUnsafe?.user;

    const initAuth = async () => {
      try {
        let token = authService.getToken();
        let user = userService.getUser();

        if (!user) {
          user = await getUser(telegramUser.id);
          if (user) userService.setUser(user);
        }

        if (token && user) {
          setIsAuth(true);
          return;
        }

        if (!telegramUser?.id) {
          throw new Error('TELEGRAM_USER_NOT_FOUND');
        }

        const telegramId = String(telegramUser.id);

        try {
          // Пробуем получить токен
          token = await fetchToken(telegramId);
        } catch (err: any) {
          // Если юзер не зарегистрирован — создаём
          if (err?.response?.data?.message === 'USER_NOT_REGISTERED') {
            const nickname =
            telegramUser.first_name
              ? `${telegramUser.first_name}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`
              : telegramUser.username || '';
            await createUser(telegramId, nickname);
            token = await fetchToken(telegramId);
            user = await getUser(telegramId);
          } else {
            throw err;
          }
        }
        
        if (token && user) {
          authService.setToken(token);
          userService.setUser(user)
          setIsAuth(true);
        }
      } catch (e) {
          authService.removeToken();
          setIsAuth(false);
      } finally {
          setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  if (isLoading) return null; // или Loader

  return (
    <AuthContext.Provider value={{ isAuth, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};