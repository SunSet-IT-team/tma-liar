import type { Request, Response } from 'express';
import { UserService } from './user.service';
import { ApiError, success } from '../common/response';
import { FindUserDtoSchema, type FindUserDto } from './dtos/user-find.dto';
import { FindUsersDtoSchema, type FindUsersDto } from './dtos/user-findUsers.dto';
import { CreateUserDtoSchema, type CreateUserDto } from './dtos/user-create.dto';
import { UpdateUserDtoSchema, type UpdateUserDto } from './dtos/user-update.dto';
import { DeleteUserDtoSchema, type DeleteUserDto } from './dtos/user-delete.dto';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../observability/logger';

type UserUpdateRequest = Request & {
  file?: {
    mimetype: string;
    buffer: Buffer;
  };
};

/**
 * Класс контроллеров пользователей
 */
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Текущий пользователь по auth. Источник правды — сервер (id + telegramId).
   */
  getMe = async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    if (!authReq.userId) {
      throw new ApiError(401, 'UNAUTHORIZED');
    }
    const user = await this.userService.findUserByAuthId({ authUserId: authReq.userId });
    return res.status(200).json(success(user));
  };

  /**
   * Контроллер поиска одного пользователя
   */
  findUser = async (req: Request, res: Response) => {
    const result = FindUserDtoSchema.safeParse({ telegramId: req.params.telegramId });

    if (!result.success) {
      throw new ApiError(422, "FIND_USER_DATA_INVALID");
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
      throw new ApiError(422, "FIND_USERS_DATA_INVALID");
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
      throw new ApiError(422, "CREATE_USER_DATA_INVALID");
    }

    const dto: CreateUserDto = result.data;
    const user = await this.userService.createUser(dto);

    return res.status(200).json(success(user));
  };

  /**
   * Контроллер обновления пользователя
   */
  updateUser = async (req: Request, res: Response) => {
    try {
      const updateReq = req as UserUpdateRequest;
      const authReq = req as AuthRequest;
      const authHeader = req.headers.authorization;
      if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(403, 'TELEGRAM_AUTH_REQUIRED');
      }

      if (!authReq.userId) {
        throw new ApiError(401, 'UNAUTHORIZED');
      }

      const currentUser = await this.userService.findUserByAuthId({ authUserId: authReq.userId });
      if (currentUser.telegramId !== req.params.telegramId) {
        throw new ApiError(403, 'USER_UPDATE_FORBIDDEN');
      }

      let profileImgFromFile: string | undefined;
      if (updateReq.file) {
        if (!updateReq.file.mimetype.startsWith('image/')) {
          throw new ApiError(422, 'INVALID_PROFILE_IMAGE_TYPE');
        }
        profileImgFromFile = `data:${updateReq.file.mimetype};base64,${updateReq.file.buffer.toString('base64')}`;
      }

      const safeBody = (req.body ?? {}) as Record<string, unknown>;

      const bodyResult = UpdateUserDtoSchema.safeParse({
        telegramId: req.params.telegramId,
        ...safeBody,
        profileImg: profileImgFromFile ?? safeBody.profileImg,
      });

      if (!bodyResult.success) {
        throw new ApiError(422, "UPDATE_USER_DATA_INVALID");
      }

      const dto: UpdateUserDto = bodyResult.data;
      const user = await this.userService.updateUser(dto);

      return res.status(200).json(success(user));
    } catch (error) {
      logger.error(
        {
          error,
          telegramIdParam: req.params.telegramId,
          hasFile: Boolean((req as UserUpdateRequest).file),
          bodyKeys: Object.keys((req.body ?? {}) as Record<string, unknown>),
        },
        'Error handling update user',
      );
      throw error;
    }
  };

  /**
   * Контроллер удаления пользователя
   */
  deleteUser = async (req: Request, res: Response) => {
    const result = DeleteUserDtoSchema.safeParse({ telegramId: req.params.telegramId });

    if (!result.success) {
      throw new ApiError(422, "DELETE_USER_DATA_INVALID");
    }

    const dto: DeleteUserDto = result.data;
    const user = await this.userService.deleteUser(dto);

    return res.status(200).json(success(user));
  };
}
