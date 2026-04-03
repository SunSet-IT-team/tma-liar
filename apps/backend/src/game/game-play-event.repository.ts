import { GamePlayEventModel } from './game-play-event.model';

export class GamePlayEventRepository {
  public async recordGameStarted(param: { deckId: string; lobbyCode: string }): Promise<void> {
    await GamePlayEventModel.create({
      deckId: param.deckId,
      lobbyCode: param.lobbyCode,
      playedAt: new Date(),
    });
  }

  public async countAll(): Promise<number> {
    return GamePlayEventModel.countDocuments();
  }

  public async countByDeck(): Promise<{ deckId: string; count: number }[]> {
    const rows = await GamePlayEventModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$deckId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return rows.map((r) => ({ deckId: r._id, count: r.count }));
  }
}
