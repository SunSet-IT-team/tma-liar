import type {
  UserApiFindUserParams,
  UserApiFindUsersParams,
  UserApiCreateUserParams,
  UserApiUpdateUserParams,
  UserApiDeleteUserParams,
} from './user.params';
import type { User } from './entities/user.entity';
import { ApiError } from '../common/response';
import { UserModel } from './user.modal';

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
  
  public async findUser(param?: UserApiFindUserParams): Promise<User | null> {
    if(!param?.telegramId) throw new ApiError(400, "USER_ID_NOT_SET");

    return UserModel.findOne({ telegramId: param.telegramId }).lean();
  }

  public async findUsers(param?: UserApiFindUsersParams): Promise<User[] | []> {
    if(!param?.telegramIds || param.telegramIds.length == 0) throw new ApiError(400, "USER_IDS_NOT_SET");
    
    return UserModel.find({ telegramId: { $in: param.telegramIds } }).lean();
  }

  public async createUser(param: UserApiCreateUserParams): Promise<User> {
    if(!param.telegramId) throw new ApiError(400, "USER_ID_NOT_SET");

    if(!param.nickname) throw new ApiError(400, "NICKNAME_NOT_SET");

    return (await UserModel.create(param)).toObject();
  }

  public async updateUser(param: UserApiUpdateUserParams): Promise<User> {
    if(!param.telegramId) throw new ApiError(400, "USER_ID_NOT_SET");

    const { telegramId, ...updateFields } = param; 

    const updatedUser = await UserModel.findOneAndUpdate(
      { telegramId },
      { $set: updateFields}, 
      { new: true },
    ).lean();

    if(!updatedUser) throw new ApiError(400, "USER_NOT_FOUND");

    return updatedUser;
  }

  public async deleteUser(param: UserApiDeleteUserParams): Promise<User> {
    if (!param.telegramId) throw new ApiError(400, "USER_ID_NOT_SET");

    const deletedUser = await UserModel.findOneAndDelete({ telegramId: param.telegramId }).lean();

    if (!deletedUser) throw new ApiError(400, "USER_NOT_FOUND");

    return deletedUser;
  }  
}
