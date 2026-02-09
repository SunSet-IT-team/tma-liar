const USER_KEY = 'user';

export type User = {
  nickname?: string;
  profileImg?: string;
  telegramId: string;
  passwordHash?: string;
}

/** 
 * Работа с пользователем через localStorage
*/
export const userService = {
  getUser(): User | null {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser() {
    localStorage.removeItem(USER_KEY);
  }
}