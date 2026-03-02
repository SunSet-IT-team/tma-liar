import { retrieveRawInitData } from '@tma.js/sdk';
import { createContext, useEffect, useState } from 'react';
import { authService } from '../../../shared/services/auth.service';
import { fetchToken } from '../../../shared/services/api/auth.api';

type AuthMode = 'full' | 'guest';

export const AuthContext = createContext({
  isAuth: false,
  isLoading: true,
  mode: 'guest' as AuthMode,
  requiresTmaLogin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode>('guest');
  const [requiresTmaLogin, setRequiresTmaLogin] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        let token = authService.getToken();

        if (token) {
          setIsAuth(true);
          setMode('full');
          setRequiresTmaLogin(false);
          return;
        }

        const normalizedInitData = retrieveRawInitData();

        if (!normalizedInitData) {
          throw new Error('INIT_DATA_NOT_FOUND');
        }

        token = await fetchToken(normalizedInitData);
        
        if (token !== null) authService.setToken(token);

        setIsAuth(true);
        setMode('full');
        setRequiresTmaLogin(false);
      } catch (e) {
        authService.removeToken();
        setIsAuth(false);
        setMode('guest');
        setRequiresTmaLogin(true);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  if (isLoading) return null; // или Loader

  return (
    <AuthContext.Provider value={{ isAuth, isLoading, mode, requiresTmaLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
