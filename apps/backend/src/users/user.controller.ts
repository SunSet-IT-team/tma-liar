import type { Request, Response } from 'express';
import { UserService } from './user.service';
import { ApiError, success } from '../common/response';
import { FindUserDtoSchema, type FindUserDto } from './dtos/user-find.dto';
import { FindUsersDtoSchema, type FindUsersDto } from './dtos/user-findUsers.dto';
import { CreateUserDtoSchema, type CreateUserDto } from './dtos/user-create.dto';
import { UpdateUserDtoSchema, type UpdateUserDto } from './dtos/user-update.dto';
import { DeleteUserDtoSchema, type DeleteUserDto } from './dtos/user-delete.dto';

/**
 * Класс контроллеров пользователей
 */
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Контроллер поиска одного пользователя
   */
  findUser = async (req: Request, res: Response) => {
    const result = FindUserDtoSchema.safeParse({ telegramId: req.params.telegramId });

    if (!result.success) {
      throw new ApiError(400, "FIND_USER_DATA_INVALID");
    }

    const dto: FindUserDto = result.data;
    const user = await this.userService.findUser(dto);

    if (!user) throw new ApiError(404, "USER_NOT_FOUND");

    return res.status(200).json(success(user));
  };

  /**
   * Контроллер поиска нескольких пользователей
   */
  findUsers = async (req: Request, res: Response) => {
    const raw = req.query.telegramIds;
    const telegramIds = Array.isArray(raw)
      ? raw.map((id) => String(id))
      : typeof raw === 'string'
        ? raw.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    const result = FindUsersDtoSchema.safeParse({ telegramIds });

    if (!result.success) {
      throw new ApiError(400, "FIND_USERS_DATA_INVALID");
    }

    const dto: FindUsersDto = result.data;
    const users = await this.userService.findUsers(dto);

    return res.status(200).json(success(users));
  };

  /**
   * Контроллер создания пользователя
   */
  createUser = async (req: Request, res: Response) => {
    const result = CreateUserDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(400, "CREATE_USER_DATA_INVALID");
    }

    const dto: CreateUserDto = result.data;
    const user = await this.userService.createUser(dto);

    return res.status(200).json(success(user));
  };

  /**
   * Контроллер обновления пользователя
   */
  updateUser = async (req: Request, res: Response) => {
    const bodyResult = UpdateUserDtoSchema.safeParse({
      telegramId: req.params.telegramId,
      ...req.body,
    });

    if (!bodyResult.success) {
      throw new ApiError(400, "UPDATE_USER_DATA_INVALID");
    }

    const dto: UpdateUserDto = bodyResult.data;
    const user = await this.userService.updateUser(dto);

    return res.status(200).json(success(user));
  };

  /**
   * Контроллер удаления пользователя
   */
  deleteUser = async (req: Request, res: Response) => {
    const result = DeleteUserDtoSchema.safeParse({ telegramId: req.params.telegramId });

    if (!result.success) {
      throw new ApiError(400, "DELETE_USER_DATA_INVALID");
    }

    const dto: DeleteUserDto = result.data;
    const user = await this.userService.deleteUser(dto);

    return res.status(200).json(success(user));
  };
}
