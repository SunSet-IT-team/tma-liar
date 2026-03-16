export const ADMIN_LOGIN = 'admin';
export const ADMIN_PASSWORD = 'liar-super-secret-2025';
export const ADMIN_STATIC_TOKEN = 'adm_static_9f8e7d6c5b4a3210';

const AUTH_KEY = 'admin_authenticated';

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function login(username: string, password: string): boolean {
  if (username === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}
