const TOKEN_KEY = 'jwt_token';

/** 
 * Работа с токеном через localStorage
*/
export const authService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  }
};