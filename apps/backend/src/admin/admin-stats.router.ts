import { Router } from 'express';
import { Types } from 'mongoose';
import { adminTokenMiddleware } from '../middlewares/adminToken.middleware';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { UserModel } from '../users/user.model';
import { GuestPresenceModel } from '../presence/guest-presence.model';
import { DeckPurchaseModel } from '../decks/deck-purchase.model';
import { DeckModel } from '../decks/deck.model';
import { success } from '../common/response';
import { GamePlayEventRepository } from '../game/game-play-event.repository';
import { SubscriptionPurchaseModel } from '../billing/subscription-purchase.model';

export const adminStatsRouter = Router();

const PRESENCE_WINDOW_MS = 3 * 60 * 1000;

const gamePlayEventRepository = new GamePlayEventRepository();

adminStatsRouter.use(adminTokenMiddleware);

function deckIdsToObjectIds(ids: string[]): Types.ObjectId[] {
  return ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
}

async function deckNameMapForIds(deckIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(deckIds)];
  const oids = deckIdsToObjectIds(unique);
  if (oids.length === 0) return new Map();
  const decks = await DeckModel.find({ _id: { $in: oids } })
    .select({ name: 1 })
    .lean();
  const map = new Map<string, string>();
  for (const d of decks) {
    const id = (d as { _id: Types.ObjectId })._id.toString();
    map.set(id, (d as { name?: string }).name ?? id);
  }
  return map;
}

adminStatsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const totalUsers = await UserModel.countDocuments();

    const presenceSince = new Date(Date.now() - PRESENCE_WINDOW_MS);
    const [activeDocs, guestDocs] = await Promise.all([
      UserModel.find({ lastActiveAt: { $gte: presenceSince } })
        .sort({ lastActiveAt: -1 })
        .select({ nickname: 1, telegramId: 1, profileImg: 1, lastActiveAt: 1 })
        .lean(),
      GuestPresenceModel.find({ lastActiveAt: { $gte: presenceSince } })
        .sort({ lastActiveAt: -1 })
        .select({ guestId: 1, nickname: 1, lastActiveAt: 1 })
        .lean(),
    ]);

    const fromUsers = activeDocs.map((u) => {
      const id =
        (u as { _id?: { toString: () => string } })._id?.toString?.() ??
        (u as { id?: string }).id ??
        '';
      return {
        id,
        telegramId: u.telegramId,
        nickname: u.nickname,
        profileImg: u.profileImg ?? null,
        lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : null,
        isGuest: false as const,
      };
    });

    const fromGuests = guestDocs.map((g) => ({
      id: g.guestId,
      telegramId: g.guestId,
      nickname: g.nickname,
      profileImg: null as string | null,
      lastActiveAt: g.lastActiveAt ? new Date(g.lastActiveAt).toISOString() : null,
      isGuest: true as const,
    }));

    const activeUsers = [...fromUsers, ...fromGuests].sort((a, b) => {
      const ta = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      const tb = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      return tb - ta;
    });

    const totalGames = await gamePlayEventRepository.countAll();
    const usageRows = await gamePlayEventRepository.countByDeck();
    const usageDeckIds = usageRows.map((r) => r.deckId);
    const usageNames = await deckNameMapForIds(usageDeckIds);

    const deckUsage = usageRows.map((row) => ({
      deckId: row.deckId,
      deckName: usageNames.get(row.deckId) ?? row.deckId,
      count: row.count,
    }));

    const totalSubscriptions = await SubscriptionPurchaseModel.countDocuments();

    res.json(
      success({
        totalUsers,
        activeUsersNow: activeUsers.length,
        activeUsers,
        totalGames,
        totalSubscriptions,
        deckUsage,
      }),
    );
  }),
);

adminStatsRouter.get(
  '/subscriptions-by-day',
  asyncHandler(async (_req, res) => {
    const rows = await SubscriptionPurchaseModel.aggregate<{ _id: string; count: number }>([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$purchasedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const points = rows.map((r) => ({ date: r._id, count: r.count }));
    res.json(success({ points }));
  }),
);

adminStatsRouter.get(
  '/deck-purchases',
  asyncHandler(async (req, res) => {
    const { deckId } = req.query as { deckId?: string };

    if (!deckId) {
      const counts = await DeckPurchaseModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$deckId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      const nameMap = await deckNameMapForIds(counts.map((c) => c._id));
      const items = counts.map((c) => ({
        deckId: c._id,
        deckName: nameMap.get(c._id) ?? c._id,
        count: c.count,
      }));
      res.json(success({ items }));
      return;
    }

    const perDay = await DeckPurchaseModel.aggregate([
      { $match: { deckId } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$purchasedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(success({ deckId, perDay }));
  }),
);

adminStatsRouter.get(
  '/deck-purchase-events',
  asyncHandler(async (req, res) => {
    const rawLimit = Number((req.query as { limit?: string }).limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(500, Math.max(1, rawLimit))
      : 150;

    const rows = await DeckPurchaseModel.find()
      .sort({ purchasedAt: -1 })
      .limit(limit)
      .lean();

    const deckIds = [...new Set(rows.map((r) => r.deckId))];
    const nameMap = await deckNameMapForIds(deckIds);

    const items = rows.map((r) => ({
      deckId: r.deckId,
      deckName: nameMap.get(r.deckId) ?? r.deckId,
      telegramId: r.telegramId,
      purchasedAt: r.purchasedAt ? new Date(r.purchasedAt).toISOString() : null,
      amountRub: typeof r.amountRub === 'number' ? r.amountRub : null,
      paymentMethod: r.paymentMethod ?? null,
    }));

    res.json(success({ items }));
  }),
);

adminStatsRouter.get(
  '/subscription-events',
  asyncHandler(async (req, res) => {
    const rawLimit = Number((req.query as { limit?: string }).limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(500, Math.max(1, rawLimit))
      : 150;

    const rows = await SubscriptionPurchaseModel.find()
      .sort({ purchasedAt: -1 })
      .limit(limit)
      .lean();

    const items = rows.map((r) => ({
      telegramId: r.telegramId,
      purchasedAt: r.purchasedAt ? new Date(r.purchasedAt).toISOString() : null,
      amountRub: r.amountRub,
      validUntil: r.validUntil ? new Date(r.validUntil).toISOString() : null,
    }));

    res.json(success({ items }));
  }),
);
