import type { User } from './entities/user.entity';
import { ApiError } from '../common/response';
import type { FindUserDto } from './dtos/user-find.dto';
import type { FindUsersDto } from './dtos/user-findUsers.dto';
import type { CreateUserDto } from './dtos/user-create.dto';
import type { UpdateUserDto } from './dtos/user-update.dto';
import type { DeleteUserDto } from './dtos/user-delete.dto';
import { UserRepository } from './user.repository';
import { LobbyRepository } from '../lobby/lobby.repository';
import { logger } from '../observability/logger';

/**
 * Интерфейс для сервиса пользователей
 */
export interface UserServiceMethods {
  findUserById: (param: { id: string }) => Promise<User>;
  findUserByAuthId: (param: { authUserId: string }) => Promise<User>;
  findUser: (param: FindUserDto) => Promise<User | null>;
  findUsers: (param: FindUsersDto) => Promise<User[]>;
  createUser: (param: CreateUserDto) => Promise<User>;
  updateUser: (param: UpdateUserDto) => Promise<User>;
  deleteUser: (param: DeleteUserDto) => Promise<User>;
  touchPresence: (param: { authUserId: string }) => Promise<void>;
}

/**
 * Сервис пользователей
 */
export class UserService implements UserServiceMethods {
  constructor(
    private readonly userRepository: UserRepository = new UserRepository(),
    private readonly lobbyRepository: LobbyRepository = new LobbyRepository(),
  ) {}

  public async findUserById(param: { id: string }): Promise<User> {
    const user = await this.userRepository.findById(param.id);

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND');
    }

    return user;
  }

  public async findUserByAuthId(param: { authUserId: string }): Promise<User> {
    const byId = await this.userRepository.findById(param.authUserId);
    if (byId) {
      return byId;
    }

    const byTelegramId = await this.userRepository.findByTelegramId(param.authUserId);
    if (byTelegramId) {
      return byTelegramId;
    }

    throw new ApiError(404, 'USER_NOT_FOUND');
  }

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

    if (typeof param.profileImg === 'string') {
      try {
        await this.lobbyRepository.updatePlayerProfileImg(param.telegramId, param.profileImg);
      } catch (error) {
        logger.warn(
          { telegramId: param.telegramId, error },
          'Failed to sync player profile image to lobby snapshots',
        );
      }
    }

    return updatedUser;
  }

  public async deleteUser(param: DeleteUserDto): Promise<User> {
    const deletedUser = await this.userRepository.deleteByTelegramId(param.telegramId);

    if (!deletedUser) throw new ApiError(404, 'USER_NOT_FOUND');

    return deletedUser;
  }

  public async touchPresence(param: { authUserId: string }): Promise<void> {
    await this.userRepository.touchLastActiveAt(param.authUserId);
  }
}
