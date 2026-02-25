import { describe, expect, it, mock } from 'bun:test';
import { ApiError } from '../../../common/response';
import { GameService } from '../../../game/game.service';
import { GameStages } from '../../../lobby/entities/lobby.entity';

function createGameDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: 'game-1',
    stage: GameStages.QUESTION_TO_LIAR,
    liarId: 'liar',
    doLie: true,
    timerId: null,
    questionHistory: [],
    activeQuestion: null,
    winnerId: null,
    loserId: null,
    loserTask: null,
    settings: {
      questionCount: 2,
      deck: {
        questions: [
          { id: 'q1', content: 'Q1' },
          { id: 'q2', content: 'Q2' },
        ],
      },
    },
    players: [
      { id: 'liar', score: 0, answer: null, likes: 0, isConfirmed: false, wasLiar: 0 },
      { id: 'p1', score: 0, answer: 1, likes: 0, isConfirmed: false, wasLiar: 0 },
      { id: 'p2', score: 0, answer: 2, likes: 1, isConfirmed: false, wasLiar: 0 },
    ],
    markModified: () => undefined,
    save: async () => undefined,
    toObject: function () {
      return { ...this };
    },
    ...overrides,
  } as any;
}

function createService(gameDoc: any | null) {
  const io = { to: () => ({ emit: () => undefined }) } as any;
  const gameRepository = {
    findByIdLean: mock(async () => (gameDoc ? gameDoc : null)),
    findByIdDocument: mock(async () => (gameDoc ? gameDoc : null)),
  };

  const service = new GameService(io, gameRepository as any, {} as any);
  return { service, gameRepository };
}

describe('GameService', () => {
  it('findGame returns game and throws when not found', async () => {
    const ok = createService(createGameDoc());
    expect((await ok.service.findGame('game-1')).id).toBe('game-1');

    const bad = createService(null);
    await expect(bad.service.findGame('game-1')).rejects.toBeInstanceOf(ApiError);
  });

  it('pickNextQuestion returns first unanswered question', () => {
    const { service } = createService(createGameDoc());
    const game = createGameDoc({ questionHistory: ['q1'] });
    const question = service.pickNextQuestion(game);
    expect(question?.id).toBe('q2');
  });

  it('chooseLiar assigns liar and increments wasLiar', async () => {
    const { service } = createService(createGameDoc());
    const game = createGameDoc({
      players: [
        { id: 'p1', wasLiar: 0, score: 0, answer: null, likes: 0, isConfirmed: false },
        { id: 'p2', wasLiar: 0, score: 0, answer: null, likes: 0, isConfirmed: false },
      ],
    });

    const originalRandom = Math.random;
    Math.random = () => 0;
    await service.chooseLiar(game);
    Math.random = originalRandom;

    expect(game.liarId).toBe('p1');
    expect(game.players[0]?.wasLiar).toBe(1);
  });

  it('calculate points methods update scores', async () => {
    const { service } = createService(createGameDoc());
    const game = createGameDoc({ doLie: true });

    await service.calculateLiarPoints(game);
    await service.calculatePlayersPoints(game);
    await service.calculatePlayersPointsWithLikes(game);

    expect(game.players.find((p: any) => p.id === 'liar')?.score).toBeGreaterThan(0);
    expect(game.players.find((p: any) => p.id === 'p1')?.score).toBeGreaterThanOrEqual(200);
    expect(game.players.find((p: any) => p.id === 'p2')?.score).toBeGreaterThanOrEqual(10);
  });

  it('setAnswer validates branches and sets answer', async () => {
    const missing = createService(null);
    await expect(missing.service.setAnswer({ gameId: 'g', playerId: 'p1', answer: 1 })).rejects.toBeInstanceOf(ApiError);

    const wrongStageGame = createGameDoc({ stage: GameStages.LOBBY });
    const wrongStage = createService(wrongStageGame);
    await expect(wrongStage.service.setAnswer({ gameId: 'g', playerId: 'p1', answer: 1 })).rejects.toBeInstanceOf(ApiError);

    const noPlayer = createService(createGameDoc());
    await expect(noPlayer.service.setAnswer({ gameId: 'g', playerId: 'unknown', answer: 1 })).rejects.toBeInstanceOf(ApiError);

    const confirmedGame = createGameDoc({ players: [{ id: 'p1', isConfirmed: true, answer: 1, score: 0, likes: 0 }] });
    const confirmed = createService(confirmedGame);
    await expect(confirmed.service.setAnswer({ gameId: 'g', playerId: 'p1', answer: 1 })).rejects.toBeInstanceOf(ApiError);

    const okGame = createGameDoc();
    const ok = createService(okGame);
    const player = await ok.service.setAnswer({ gameId: 'g', playerId: 'p1', answer: 0 });
    expect(player.answer).toBe(0);
  });

  it('confirmAnswer validates branches and confirms answer', async () => {
    const missing = createService(null);
    await expect(missing.service.confirmAnswer({ gameId: 'g', playerId: 'p1' })).rejects.toBeInstanceOf(ApiError);

    const wrongStage = createService(createGameDoc({ stage: GameStages.LOBBY }));
    await expect(wrongStage.service.confirmAnswer({ gameId: 'g', playerId: 'p1' })).rejects.toBeInstanceOf(ApiError);

    const noPlayer = createService(createGameDoc());
    await expect(noPlayer.service.confirmAnswer({ gameId: 'g', playerId: 'unknown' })).rejects.toBeInstanceOf(ApiError);

    const didntAnswer = createService(createGameDoc({ players: [{ id: 'p1', answer: 2, isConfirmed: false, score: 0, likes: 0 }] }));
    await expect(didntAnswer.service.confirmAnswer({ gameId: 'g', playerId: 'p1' })).rejects.toBeInstanceOf(ApiError);

    const already = createService(createGameDoc({ players: [{ id: 'p1', answer: 1, isConfirmed: true, score: 0, likes: 0 }] }));
    await expect(already.service.confirmAnswer({ gameId: 'g', playerId: 'p1' })).rejects.toBeInstanceOf(ApiError);

    const ok = createService(createGameDoc({ stage: GameStages.QUESTION_RESULTS }));
    const player = await ok.service.confirmAnswer({ gameId: 'g', playerId: 'p1' });
    expect(player.isConfirmed).toBeTrue();
  });

  it('likeAnswer validates branches and increments likes', async () => {
    const base = createGameDoc({ stage: GameStages.QUESTION_RESULTS });

    const self = createService(base);
    await expect(self.service.likeAnswer({ gameId: 'g', senderId: 'p1', receiverId: 'p1' })).rejects.toBeInstanceOf(ApiError);

    const missing = createService(null);
    await expect(missing.service.likeAnswer({ gameId: 'g', senderId: 'p1', receiverId: 'p2' })).rejects.toBeInstanceOf(ApiError);

    const wrongStage = createService(createGameDoc({ stage: GameStages.LOBBY }));
    await expect(wrongStage.service.likeAnswer({ gameId: 'g', senderId: 'p1', receiverId: 'p2' })).rejects.toBeInstanceOf(ApiError);

    const toLiar = createService(base);
    await expect(toLiar.service.likeAnswer({ gameId: 'g', senderId: 'p1', receiverId: 'liar' })).rejects.toBeInstanceOf(ApiError);

    const noSender = createService(base);
    await expect(noSender.service.likeAnswer({ gameId: 'g', senderId: 'x', receiverId: 'p2' })).rejects.toBeInstanceOf(ApiError);

    const senderDidntAnswer = createService(createGameDoc({
      stage: GameStages.QUESTION_RESULTS,
      players: [
        { id: 'liar', score: 0, answer: null, likes: 0, isConfirmed: false, wasLiar: 0 },
        { id: 'p1', score: 0, answer: 2, likes: 0, isConfirmed: false, wasLiar: 0 },
        { id: 'p2', score: 0, answer: 1, likes: 0, isConfirmed: false, wasLiar: 0 },
      ],
    }));
    await expect(senderDidntAnswer.service.likeAnswer({ gameId: 'g', senderId: 'p1', receiverId: 'p2' })).rejects.toBeInstanceOf(ApiError);

    const noReceiver = createService(base);
    await expect(noReceiver.service.likeAnswer({ gameId: 'g', senderId: 'p1', receiverId: 'x' })).rejects.toBeInstanceOf(ApiError);

    const ok = createService(base);
    const receiver = await ok.service.likeAnswer({ gameId: 'g', senderId: 'p1', receiverId: 'p2' });
    expect(receiver.likes).toBeGreaterThanOrEqual(1);
  });

  it('liarChooses validates stage and triggers next stage', async () => {
    const wrong = createService(createGameDoc({ stage: GameStages.LOBBY }));
    await expect(wrong.service.liarChooses({ gameId: 'g', answer: true })).rejects.toBeInstanceOf(ApiError);

    const okGame = createGameDoc({ stage: GameStages.QUESTION_TO_LIAR, doLie: null });
    const ok = createService(okGame);
    (ok.service as any).nextStage = mock(async () => GameStages.QUESTION_RESULTS);

    const result = await ok.service.liarChooses({ gameId: 'g', answer: false });
    expect(result).toBeFalse();
    expect((ok.service as any).nextStage).toHaveBeenCalled();
  });
});
