import type { User } from './entities/user.entity';
import { ApiError } from '../common/response';
import type { FindUserDto } from './dtos/user-find.dto';
import type { FindUsersDto } from './dtos/user-findUsers.dto';
import type { CreateUserDto } from './dtos/user-create.dto';
import type { UpdateUserDto } from './dtos/user-update.dto';
import type { DeleteUserDto } from './dtos/user-delete.dto';
import { UserRepository } from './user.repository';

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
  constructor(private readonly userRepository: UserRepository = new UserRepository()) {}

  public async findUser(param: FindUserDto): Promise<User> {
    const user = await this.userRepository.findByTelegramId(param.telegramId);

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND');
    }

    return user;
  }

  public async findUsers(param: FindUsersDto): Promise<User[]> {
    const users = await this.userRepository.findByTelegramIds(param);

    if (!users || users.length === 0) throw new ApiError(404, 'USERS_NOT_FOUND');
    return users;
  }

  public async createUser(param: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(param);

    if (!user) throw new ApiError(400, 'USER_NOT_CREATED');
    return user;
  }

  public async updateUser(param: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userRepository.updateByTelegramId(param);

    if (!updatedUser) throw new ApiError(404, 'USER_NOT_FOUND');

    return updatedUser;
  }

  public async deleteUser(param: DeleteUserDto): Promise<User> {
    const deletedUser = await this.userRepository.deleteByTelegramId(param.telegramId);

    if (!deletedUser) throw new ApiError(404, 'USER_NOT_FOUND');

    return deletedUser;
  }
}
