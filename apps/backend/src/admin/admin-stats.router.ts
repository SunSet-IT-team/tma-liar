import { Router } from 'express';
import { adminTokenMiddleware } from '../middlewares/adminToken.middleware';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { UserModel } from '../users/user.model';
import { GameModel } from '../game/game.model';
import { DeckPurchaseModel } from '../decks/deck-purchase.model';
import { success } from '../common/response';

export const adminStatsRouter = Router();

adminStatsRouter.use(adminTokenMiddleware);

adminStatsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const totalUsers = await UserModel.countDocuments();
    const totalGames = await GameModel.countDocuments();

    res.json(
      success({
        totalUsers,
        activeUsersNow: 0,
        totalGames,
        totalSubscriptions: 0,
      }),
    );
  }),
);

adminStatsRouter.get(
  '/subscriptions-by-day',
  asyncHandler(async (_req, res) => {
    res.json(success({ points: [] }));
  }),
);

adminStatsRouter.get(
  '/deck-purchases',
  asyncHandler(async (req, res) => {
    const { deckId } = req.query as { deckId?: string };

    if (!deckId) {
      const counts = await DeckPurchaseModel.aggregate([
        { $group: { _id: '$deckId', count: { $sum: 1 } } },
      ]);
      res.json(success({ items: counts }));
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
