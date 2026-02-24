import { createContext, useEffect, useState } from 'react';
import { authService } from '../../../shared/services/auth.service';
import { fetchToken } from '../../../shared/services/api/auth.api';
import { createUser } from '../../../shared/services/api/user.api';

export const AuthContext = createContext({
  isAuth: false,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        let token = authService.getToken();

        if (token) {
          setIsAuth(true);
          return;
        }

        const tg = window.Telegram?.WebApp;
        const telegramUser = tg?.initDataUnsafe?.user;

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
            await createUser(telegramId, telegramUser.username);
            token = await fetchToken(telegramId);
          } else {
            throw err;
          }
        }
        
        if (token !== null)
        authService.setToken(token);
        setIsAuth(true);
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