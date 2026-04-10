import { Schema, model } from "mongoose";
import type { User } from "./entities/user.entity";

const UserSchema = new Schema<User>(
  {
    nickname: { type: String, required: true },
    telegramId: { type: String, required: true, unique: true },
    profileImg: { type: String },
    passwordHash: { type: String },
    token: { type: String },
    lastActiveAt: { type: Date },
    /** Внутриигровой баланс в рублях (списания без внешней кассы). */
    balanceRub: { type: Number, default: 100 },
    /** Подписка активна до этой даты (включительно по смыслу «до конца дня» задаётся клиентом). */
    subscriptionUntil: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true }, 
  }
);

UserSchema.virtual('id').get(function () {
  return this._id.toString();
});

export const UserModel = model<User>("User", UserSchema);
