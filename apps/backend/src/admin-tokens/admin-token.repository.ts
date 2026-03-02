import { AdminTokenModel, type AdminToken } from './admin-token.model';

export class AdminTokenRepository {
  public async create(payload: { name: string; prefix: string; tokenHash: string }): Promise<AdminToken> {
    const token = await AdminTokenModel.create(payload);
    return token.toObject();
  }

  public async findActiveByHash(tokenHash: string): Promise<AdminToken | null> {
    const token = await AdminTokenModel.findOne({
      tokenHash,
      revokedAt: null,
    }).lean();

    return (token as AdminToken | null) ?? null;
  }

  public async markUsed(id: string): Promise<void> {
    await AdminTokenModel.updateOne({ _id: id }, { $set: { lastUsedAt: new Date() } });
  }

  public async listAll(): Promise<AdminToken[]> {
    const tokens = await AdminTokenModel.find().sort({ createdAt: -1 }).lean();
    return tokens as AdminToken[];
  }

  public async revokeById(id: string): Promise<boolean> {
    const result = await AdminTokenModel.updateOne(
      { _id: id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    return result.modifiedCount > 0;
  }
}
