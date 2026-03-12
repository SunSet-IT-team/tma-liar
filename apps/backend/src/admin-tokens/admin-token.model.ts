import { Schema, model } from 'mongoose';

export interface AdminToken {
  id: string;
  name: string;
  prefix: string;
  tokenHash: string;
  createdAt: Date;
  lastUsedAt?: Date | null;
  revokedAt?: Date | null;
}

const AdminTokenSchema = new Schema<AdminToken>(
  {
    name: { type: String, required: true },
    prefix: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    lastUsedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

AdminTokenSchema.virtual('id').get(function () {
  return this._id.toString();
});

export const AdminTokenModel = model<AdminToken>('AdminToken', AdminTokenSchema);
