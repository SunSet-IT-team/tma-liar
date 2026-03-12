import { UserModel } from './user.model';
import type { User } from './entities/user.entity';
import type { FindUsersDto } from './dtos/user-findUsers.dto';
import type { CreateUserDto } from './dtos/user-create.dto';
import type { UpdateUserDto } from './dtos/user-update.dto';
import { isValidObjectId } from 'mongoose';

export class UserRepository {
  public async findById(id: string): Promise<User | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    const user = await UserModel.findById(id).lean();
    return (user as User | null) ?? null;
  }

  public async findByTelegramId(telegramId: string): Promise<User | null> {
    const user = await UserModel.findOne({ telegramId }).lean();
    return (user as User | null) ?? null;
  }

  public async findByTelegramIds(dto: FindUsersDto): Promise<User[]> {
    const users = await UserModel.find({ telegramId: { $in: dto.telegramIds } }).lean();
    return users as User[];
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

    return (updatedUser as User | null) ?? null;
  }

  public async deleteByTelegramId(telegramId: string): Promise<User | null> {
    const deletedUser = await UserModel.findOneAndDelete({ telegramId }).lean();
    return (deletedUser as User | null) ?? null;
  }
}
