import { UserModel } from './user.model';
import { SUBSCRIPTION_PERIOD_MS } from '../billing/billing.constants';
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

  /**
   * Списать сумму с баланса, если его хватает (одна атомарная операция).
   */
  public async tryDebitBalance(telegramId: string, amountRub: number): Promise<User | null> {
    if (amountRub <= 0) {
      return null;
    }
    const updated = await UserModel.findOneAndUpdate(
      { telegramId, balanceRub: { $gte: amountRub } },
      { $inc: { balanceRub: -amountRub } },
      { new: true },
    ).lean();
    return leanUserWithId(updated as User | null);
  }

  /** Вернуть средства на баланс (например откат при ошибке после списания). */
  public async creditBalance(telegramId: string, amountRub: number): Promise<void> {
    if (amountRub <= 0) {
      return;
    }
    await UserModel.updateOne({ telegramId }, { $inc: { balanceRub: amountRub } });
  }

  /**
   * Списать стоимость подписки и продлить subscriptionUntil на 30 дней от max(сейчас, текущий конец).
   * Несколько попыток при гонке обновлений баланса.
   */
  public async purchaseSubscriptionMonth(
    telegramId: string,
    priceRub: number,
  ): Promise<User | null> {
    if (priceRub <= 0) {
      return null;
    }
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const current = await UserModel.findOne({ telegramId }).lean();
      if (!current) {
        return null;
      }
      const balance = Math.max(0, Math.round((current as { balanceRub?: number }).balanceRub ?? 0));
      if (balance < priceRub) {
        return null;
      }

      const now = Date.now();
      const rawUntil = (current as { subscriptionUntil?: Date }).subscriptionUntil;
      const prevEnd = rawUntil ? new Date(rawUntil).getTime() : 0;
      const base = Math.max(now, prevEnd);
      const newUntil = new Date(base + SUBSCRIPTION_PERIOD_MS);
      const nextBalance = balance - priceRub;

      const updated = await UserModel.findOneAndUpdate(
        { telegramId, balanceRub: (current as { balanceRub?: number }).balanceRub },
        { $set: { balanceRub: nextBalance, subscriptionUntil: newUntil } },
        { new: true },
      ).lean();

      if (updated) {
        return leanUserWithId(updated as User | null);
      }
    }
    return null;
  }
}
