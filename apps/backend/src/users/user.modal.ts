import { Schema, model, Types } from "mongoose";
import type { User } from "./entities/user.entity";

const UserSchema = new Schema<User>(
  {
    nickname: { type: String, required: true },
    telegramId: { type: String, required: true, unique: true },
    profileImg: { type: String },
    passwordHash: { type: String },
    token: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserModel = model<User>("User", UserSchema);
