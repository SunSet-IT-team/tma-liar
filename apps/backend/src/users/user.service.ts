import type {
  UserApiFindUserParams,
  UserApiFindUsersParams,
  UserApiCreateUserParams,
  UserApiUpdateUserParams,
  UserApiDeleteUserParams,
} from './user.params';
import type { User } from './entities/user.entity';

/**
 * Интерфейс для API пользователей
 */
export interface UserApiMethods {
  findUser: (param?: UserApiFindUserParams) => Promise<User | null>;
  findUsers: (param?: UserApiFindUsersParams) => Promise<User[] | []>;
  createUser: (param: UserApiCreateUserParams) => Promise<User>;
  updateUser: (param: UserApiUpdateUserParams) => Promise<User>;
  deleteUser: (param: UserApiDeleteUserParams) => Promise<User>;
}

/**
 * API для пользователей
 */
export class UserApi implements UserApiMethods {
  users = new Map<number, User>();

  public async findUser(param?: UserApiFindUserParams): Promise<User | null> {
    return new Promise((resolve, reject) => {
      // Поиск по id
      if (param?.id) {
        try {
          resolve(this.users.get(param.id) || null);
        } catch (err) {
          reject(err);
        }
      }
      resolve(null);
    });
  }

  public findUsers(param?: UserApiFindUsersParams): Promise<User[] | []> {
    return new Promise((resolve, reject) => {
      if (param?.ids) {
        const userIds = param.ids;
        let usersArray: User[] = [];
        try {
          for (let key of userIds) {
            const user = this.users.get(key);
            if (user) {
              usersArray.push(user);
            }
          }
          resolve(usersArray);
        } catch (err) {
          reject(err);
        }
      }
      resolve([]);
    });
  }

  public createUser(param: UserApiCreateUserParams): Promise<User> {
    return new Promise((resolve, reject) => {
      try {
        const newUserId = this.users.size + 1;
        this.users.set(newUserId, { id: newUserId, ...param } as User);
        resolve(this.users.get(newUserId)!);
      } catch (err) {
        reject(err);
      }
    });
  }

  public updateUser(param: UserApiUpdateUserParams): Promise<User> {
    return new Promise((resolve, reject) => {
      try {
        if (param?.id && this.users.get(param?.id)) {
          const userToUpdate = this.users.get(param.id);
          if (userToUpdate) {
            this.users.set(param.id, { ...userToUpdate, ...(param as User) });
          } else {
            reject('USER_NOT_EXIST');
          }
          resolve(this.users.get(param.id)!);
        } else {
          reject('USER_ID_NOT_SET');
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  public deleteUser(param: UserApiDeleteUserParams): Promise<User> {
    return new Promise((resolve, reject) => {
      try {
        if (param?.id && this.users.get(param?.id)) {
          const userToDelete = this.users.get(param?.id);
          if (this.users.delete(param.id)) {
            resolve(userToDelete!);
          } else {
            reject('USER_NOT_EXIST');
          }
        } else {
          reject('USER_ID_NOT_SET');
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}
