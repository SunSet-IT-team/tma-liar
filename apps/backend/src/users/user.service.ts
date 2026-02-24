import type { User } from './entities/user.entity';
import { ApiError } from '../common/response';
import { UserModel } from './user.modal';
import type { FindUserDto } from './dtos/user-find.dto';
import type { FindUsersDto } from './dtos/user-findUsers.dto';
import type { CreateUserDto } from './dtos/user-create.dto';
import type { UpdateUserDto } from './dtos/user-update.dto';
import type { DeleteUserDto } from './dtos/user-delete.dto';

/**
 * Интерфейс для сервиса пользователей
 */
export interface UserServiceMethods {
  findUser: (param: FindUserDto) => Promise<User | null>;
  findUsers: (param: FindUsersDto) => Promise<User[]>;
  createUser: (param: CreateUserDto) => Promise<User>;
  updateUser: (param: UpdateUserDto) => Promise<User>;
  deleteUser: (param: DeleteUserDto) => Promise<User>;
}

/**
 * Сервис пользователей
 */
export class UserService implements UserServiceMethods {
  public async findUser(param: FindUserDto): Promise<User> {
    const user = await UserModel.findOne({ telegramId: param.telegramId });

    if (!user) {
      throw new ApiError(400, 'USER_NOT_FOUND');
    }

    return user.toObject();
  }

  public async findUsers(param: FindUsersDto): Promise<User[]> {
    const users = await UserModel.find({ telegramId: { $in: param.telegramIds } });

    if (!users || users.length === 0) throw new ApiError(400, 'USERS_NOT_FOUND');
    return users;
  }

  public async createUser(param: CreateUserDto): Promise<User> {
    const user = await UserModel.create(param);

    if (!user) throw new ApiError(400, 'USER_NOT_CREATED');
    return user;
  }

  public async updateUser(param: UpdateUserDto): Promise<User> {
    const { telegramId, ...updateFields } = param;

    const updatedUser = await UserModel.findOneAndUpdate(
      { telegramId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) throw new ApiError(400, 'USER_NOT_FOUND');

    return updatedUser.toObject();
  }

  public async deleteUser(param: DeleteUserDto): Promise<User> {
    const deletedUser = await UserModel.findOneAndDelete({ telegramId: param.telegramId });

    if (!deletedUser) throw new ApiError(400, 'USER_NOT_FOUND');

    return deletedUser.toObject();
  }
}
