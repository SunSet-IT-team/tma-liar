import { UserModel } from './user.model';
import type { User } from './entities/user.entity';
import type { FindUsersDto } from './dtos/user-findUsers.dto';
import type { CreateUserDto } from './dtos/user-create.dto';
import type { UpdateUserDto } from './dtos/user-update.dto';
import { isValidObjectId } from 'mongoose';

/** .lean() не возвращает виртуальные поля — подставляем id из _id для единообразия API. */
function leanUserWithId(doc: User | null): User | null {
  if (!doc) return null;
  const id = doc.id ?? (doc as { _id?: { toString: () => string } })._id?.toString?.();
  return id ? { ...doc, id } : doc;
}

export class UserRepository {

  public async findById(id: string): Promise<User | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    const user = await UserModel.findById(id).lean();
    return leanUserWithId(user as User | null);
  }

  public async findByTelegramId(telegramId: string): Promise<User | null> {
    const user = await UserModel.findOne({ telegramId }).lean();
    return leanUserWithId(user as User | null);
  }

  public async findByTelegramIds(dto: FindUsersDto): Promise<User[]> {
    const users = await UserModel.find({ telegramId: { $in: dto.telegramIds } }).lean();
    return (users as User[]).map((u) => leanUserWithId(u) as User);
  }

  public async create(dto: CreateUserDto): Promise<User> {
    const user = await UserModel.create(dto);
    return user.toObject();
  }

  public async updateByTelegramId(dto: UpdateUserDto): Promise<User | null> {
    const { telegramId, ...updateFields } = dto;
    const updatedUser = await UserModel.findOneAndUpdate(
      { telegramId },
      { $set: updateFields },
      { new: true }
    ).lean();

    return leanUserWithId(updatedUser as User | null);
  }

  public async deleteByTelegramId(telegramId: string): Promise<User | null> {
    const deletedUser = await UserModel.findOneAndDelete({ telegramId }).lean();
    return leanUserWithId(deletedUser as User | null);
  }

  /**
   * Обновляет время последней активности по идентификатору из JWT (Mongo id или telegramId).
   */
  public async touchLastActiveAt(authUserId: string): Promise<void> {
    const now = new Date();
    if (isValidObjectId(authUserId)) {
      const byId = await UserModel.findByIdAndUpdate(authUserId, { $set: { lastActiveAt: now } });
      if (byId) return;
    }
    await UserModel.findOneAndUpdate({ telegramId: authUserId }, { $set: { lastActiveAt: now } });
  }
}
