import type { HydratedDocument } from 'mongoose';
import type { Question } from '../decks/entities/question.entity';
import type { Player } from '../lobby/entities/player.entity';
import { ApiError, buildStatePayload } from '../common/response';
import { GameStages, LobbyStatus } from '../lobby/entities/lobby.entity';
import type { Settings } from '../lobby/entities/settings.entity';
import type { Game } from './entities/game.entity';
import type { GameStartDto } from './dtos/game-start.dto';
import type { GameNextStageDto } from './dtos/game-next-stage.dto';
import type { GamePlayerLikedDto } from './dtos/game-player-liked.dto';
import type { GamePlayerVotedDto } from './dtos/game-player-voted.dto';
import type { GamePlayerSecuredDto } from './dtos/game-player-secured.dto';
import type { GameLiarChoosesDto } from './dtos/game-liar-chooses.dto';
import type { Server } from 'socket.io';
import { findDiff } from '../common/diff';
import { GameMessageTypes } from '@liar/message-types';
import { SocketSystemEvents } from '@liar/message-types';
import type { SolverVoteAnswer } from '@liar/message-types';
import { env } from '../config/env';
import { GameRepository } from './game.repository';
import { LobbyRepository } from '../lobby/lobby.repository';
import { logger } from '../observability/logger';
import { emitToRoom } from '../socket/typed-socket';

const SCORE_NOT_STATED = env.SCORE_NOT_STATED;
const SCORE_TRICKED = env.SCORE_TRICKED;
const GAME_STAGE_TIMER_MS = env.GAME_STAGE_TIMER_MS;
const LIAR_CHOOSES_TIMER_MS = env.LIAR_CHOOSES_TIMER_MS;

console.log('LIAR_CHOOSES_TIMER_MS GAME_STAGE_TIMER_MS');
console.log(GAME_STAGE_TIMER_MS);
console.log(LIAR_CHOOSES_TIMER_MS);
const stageTransitionLocks = new Map<string, Promise<void>>();
const stageTimers = new Map<string, ReturnType<typeof setTimeout>>();

export interface GameMethods {
  createGame: (dto: GameStartDto) => Promise<Game>;
  nextStage: (dto: GameNextStageDto) => Promise<GameStages>;
  likeAnswer: (dto: GamePlayerLikedDto) => Promise<Player>;
  setAnswer: (dto: GamePlayerVotedDto) => Promise<Player>;
  finishGameBecausePlayerLeft: (dto: { gameId: string; loserId: string }) => Promise<void>;
  discardGame: (dto: { gameId: string }) => Promise<void>;
}

export class GameService implements GameMethods {
  constructor(
    private io: Server,
    private readonly gameRepository: GameRepository = new GameRepository(),
    private readonly lobbyRepository: LobbyRepository = new LobbyRepository(),
  ) {}

  private isValidLoserTask(task: string | null | undefined): boolean {
    if (typeof task !== 'string') return false;
    const normalized = task.trim();
    if (!normalized) return false;
    if (normalized.toLowerCase() === 'task') return false;
    return true;
  }

  private async withStageTransitionLock<T>(gameId: string, fn: () => Promise<T>): Promise<T> {
    const previous = stageTransitionLocks.get(gameId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    stageTransitionLocks.set(
      gameId,
      previous.then(() => current),
    );
    await previous;

    try {
      return await fn();
    } finally {
      release();
      if (stageTransitionLocks.get(gameId) === current) {
        stageTransitionLocks.delete(gameId);
      }
    }
  }

  private clearStageTimer(gameId: string) {
    const timer = stageTimers.get(gameId);
    if (!timer) return;
    clearTimeout(timer);
    stageTimers.delete(gameId);
  }

  private scheduleStageTimer(gameId: string, time: number, callback: () => Promise<void>) {
    this.clearStageTimer(gameId);
    const timer = setTimeout(() => {
      stageTimers.delete(gameId);
      void callback();
    }, time);
    stageTimers.set(gameId, timer);
  }

  private getActiveQuestionText(game: Pick<Game, 'activeQuestion' | 'settings'>): string | null {
    if (!game.activeQuestion) return null;
    const question = game.settings.deck.questions.find((item) => item.id === game.activeQuestion);
    return question?.content ?? null;
  }

  private getStageDurationMs(
    stage: GameStages,
    settings?: Pick<Settings, 'answerTime'> | null,
  ): number | null {
    if (stage === GameStages.LIAR_CHOOSES) return LIAR_CHOOSES_TIMER_MS;
    if (stage === GameStages.QUESTION_TO_LIAR) {
      // Время на этапе QUESTION_TO_LIAR задается админом при создании лобби.
      // settings.answerTime хранится в секундах.
      const answerTimeSeconds = settings?.answerTime;
      if (typeof answerTimeSeconds === 'number' && answerTimeSeconds > 0) {
        return answerTimeSeconds * 1000;
      }
      // Фолбэк на случай непредвиденных данных.
      return GAME_STAGE_TIMER_MS;
    }
    if (stage === GameStages.QUESTION_RESULTS || stage === GameStages.GAME_RESULTS) return GAME_STAGE_TIMER_MS;
    return null;
  }

  private serializePlayersForClient(game: Pick<Game, 'players'>) {
    const normalizeAnswer = (answer?: number | null): SolverVoteAnswer | null =>
      answer === 0 || answer === 1 ? answer : null;

    return game.players.map((player) => ({
      id: player.id ?? player.telegramId,
      nickname: player.nickname,
      profileImg: player.profileImg ?? '',
      isReady: player.isReady,
      inGame: player.inGame ?? true,
      loserTask: player.loserTask ?? null,
      answer: normalizeAnswer(player.answer),
      likes: player.likes ?? 0,
      isConfirmed: player.isConfirmed ?? false,
      score: player.score ?? 0,
    }));
  }

  private playerId(player: { id?: string; telegramId: string }): string {
    return player.id ?? player.telegramId;
  }

  private findPlayerById(game: Pick<Game, 'players'>, id: string) {
    return game.players.find((p) => p.id === id || p.telegramId === id);
  }
  /**
   * Функция поиска игры
   * @param gameId id игры
   * @returns
   */
  public async findGame(gameId: string): Promise<Game> {
    const game = await this.gameRepository.findByIdLean(gameId);
    if (!game) throw new ApiError(404, 'GAME_NOT_FOUND');

    return game;
  }

  /**
   * Создать игру
   *
   */
  public async createGame(dto: GameStartDto): Promise<Game> {
    const session = await this.gameRepository.startSession();
    let createdGame: Game | null = null;
    const runWithoutTransaction = async (): Promise<Game> => {
      const lobby = await this.lobbyRepository.findByCode(dto.lobbyCode);
      if (!lobby) throw new ApiError(404, 'LOBBY_NOT_FOUND');

      if (dto.player.id !== lobby.adminId) throw new ApiError(403, 'PLAYER_IS_NOT_ADMIN');
      if (lobby.status !== LobbyStatus.WAITING || lobby.currentGameId !== null) {
        throw new ApiError(409, 'GAME_ALREADY_STARTED');
      }
      if (lobby.players.length < 3) {
        throw new ApiError(400, 'NOT_ENOUGH_PLAYERS');
      }
      if (!lobby.players.every((player) => player.isReady === true)) {
        throw new ApiError(400, 'NOT_ALL_PLAYERS_READY');
      }
      if (!lobby.players.every((player) => this.isValidLoserTask(player.loserTask))) {
        throw new ApiError(400, 'LOSER_TASK_REQUIRED');
      }

      // Для повторного старта в том же лобби удаляем предыдущую игру,
      // чтобы не упереться в уникальный индекс games.lobbyCode.
      await this.gameRepository.deleteByLobbyCode(dto.lobbyCode);

      const game = await this.gameRepository.createForLobby(
        dto.lobbyCode,
        lobby.players,
        lobby.settings,
      );

      const updatedLobby = await this.lobbyRepository.markStartedIfWaiting(dto.lobbyCode, game.id);

      if (!updatedLobby) {
        await this.gameRepository.deleteById(game.id);
        throw new ApiError(409, 'LOBBY_STATE_CONFLICT');
      }

      const playersInGame = updatedLobby.players.map((player) => ({
        ...player,
        inGame: true,
      }));
      await this.lobbyRepository.updateByCode({
        lobbyCode: dto.lobbyCode,
        players: playersInGame,
      });

      return game;
    };

    try {
      await session.withTransaction(async () => {
        const lobby = await this.lobbyRepository.findByCode(dto.lobbyCode, session);
        if (!lobby) throw new ApiError(404, 'LOBBY_NOT_FOUND');

        if (dto.player.id !== lobby.adminId) throw new ApiError(403, 'PLAYER_IS_NOT_ADMIN');
        if (lobby.status !== LobbyStatus.WAITING || lobby.currentGameId !== null) {
          throw new ApiError(409, 'GAME_ALREADY_STARTED');
        }
        if (lobby.players.length < 3) {
          throw new ApiError(400, 'NOT_ENOUGH_PLAYERS');
        }
        if (!lobby.players.every((player) => player.isReady === true)) {
          throw new ApiError(400, 'NOT_ALL_PLAYERS_READY');
        }
        if (!lobby.players.every((player) => this.isValidLoserTask(player.loserTask))) {
          throw new ApiError(400, 'LOSER_TASK_REQUIRED');
        }

        // Для повторного старта в том же лобби удаляем предыдущую игру,
        // чтобы не упереться в уникальный индекс games.lobbyCode.
        await this.gameRepository.deleteByLobbyCode(dto.lobbyCode, session);

        const game = await this.gameRepository.createForLobby(
          dto.lobbyCode,
          lobby.players,
          lobby.settings,
          session,
        );

        if (!game) throw new ApiError(500, 'GAME_NOT_CREATED');

        const updatedLobby = await this.lobbyRepository.markStartedIfWaiting(
          dto.lobbyCode,
          game.id,
          session,
        );

        if (!updatedLobby) throw new ApiError(409, 'LOBBY_STATE_CONFLICT');
        const playersInGame = updatedLobby.players.map((player) => ({
          ...player,
          inGame: true,
        }));
        await this.lobbyRepository.updateByCode(
          {
            lobbyCode: dto.lobbyCode,
            players: playersInGame,
          },
          session,
        );
        createdGame = game;
      });

      if (!createdGame) throw new ApiError(500, 'GAME_NOT_CREATED');
      return createdGame;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const unsupportedTransactions =
        message.includes(
          'Transaction numbers are only allowed on a replica set member or mongos',
        ) || message.includes('does not support retryable writes');

      if (!unsupportedTransactions) {
        throw error;
      }

      logger.warn(
        { lobbyCode: dto.lobbyCode, reason: message },
        'MongoDB transactions unavailable, using non-transactional game start fallback',
      );
      return runWithoutTransaction();
    } finally {
      await session.endSession();
    }
  }

  /**
   * Функция для смены стадии и основного процесса игры
   * @param dto DTO для перехода на следующую стадию
   */
  public async nextStage(dto: GameNextStageDto): Promise<GameStages> {
    const { gameId } = dto;
    return this.withStageTransitionLock(gameId, async () => {
      const game = await this.gameRepository.findByIdDocument(gameId);
      if (!game) throw new ApiError(404, 'GAME_NOT_FOUND');

      const gameSnapobj = game.toObject();

      this.clearStageTimer(gameId);
      game.timerId = null;

      const currentStage = game.stage;

      let nextStage: GameStages;

      switch (currentStage) {
        case GameStages.LOBBY:
          nextStage = await this.handleLobbyStage(game, gameId);
          break;

        case GameStages.LIAR_CHOOSES:
          nextStage = await this.handleLiarChoosesStage(game, gameId);
          break;

        case GameStages.QUESTION_TO_LIAR:
          nextStage = await this.handleQuestionToLiarStage(game, gameId);
          break;

        case GameStages.QUESTION_RESULTS:
          nextStage = await this.handleQuestionResultsStage(game, gameId);
          break;

        case GameStages.GAME_RESULTS:
          nextStage = await this.handleGameResultsStage(game, gameId);
          break;

        case GameStages.END:
          nextStage = await this.handleEndStage(game, gameId);
          break;

        default:
          throw new ApiError(400, 'UNKNOWN_STAGE');
      }

      game.stage = nextStage;
      game.stageStartedAt = Date.now();

      game.markModified('stage');
      game.markModified('stageStartedAt');
      await game.save();

      const updatedGame = await this.gameRepository.findByIdDocument(gameId);
      if (!updatedGame) throw new ApiError(404, 'GAME_AFTER_UPDATE_NOT_FOUND');
      const updatedGameobj = updatedGame.toObject();

      const diff = findDiff(gameSnapobj, updatedGameobj, nextStage);
      logger.info(
        { gameId, currentStage, nextStage, diffKeys: Object.keys(diff) },
        'Game stage changed',
      );

      emitToRoom(this.io, gameId, SocketSystemEvents.STATUS_CHANGED, {
        ...buildStatePayload(GameMessageTypes.STAGE_CHANGED, diff),
        gameId,
        stage: nextStage,
        stageStartedAt: updatedGameobj.stageStartedAt ?? Date.now(),
        stageDurationMs: this.getStageDurationMs(nextStage, updatedGameobj.settings ?? null),
        liarId: updatedGameobj.liarId ?? null,
        players: this.serializePlayersForClient(updatedGameobj),
        activeQuestion: updatedGameobj.activeQuestion ?? null,
        activeQuestionText: this.getActiveQuestionText(updatedGameobj),
        winnerId: updatedGameobj.winnerId ?? null,
        loserId: updatedGameobj.loserId ?? null,
        loserTask: updatedGameobj.loserTask ?? null,
      });

      return nextStage;
    });
  }

  /**
   * Досрочно завершает игру, если во время активной стадии вышел игрок.
   * Вышедший игрок автоматически становится проигравшим.
   */
  public async finishGameBecausePlayerLeft(dto: {
    gameId: string;
    loserId: string;
  }): Promise<void> {
    const { gameId, loserId } = dto;

    await this.withStageTransitionLock(gameId, async () => {
      const game = await this.gameRepository.findByIdDocument(gameId);
      if (!game) throw new ApiError(404, 'GAME_NOT_FOUND');

      if (game.stage === GameStages.GAME_RESULTS || game.stage === GameStages.END) {
        return;
      }

      const gameSnapobj = game.toObject();

      this.clearStageTimer(gameId);
      game.timerId = null;

      const leftPlayer = this.findPlayerById(game, loserId);
      if (leftPlayer) {
        const minScore = Math.min(...game.players.map((player) => player.score ?? 0));
        leftPlayer.score = Math.min(leftPlayer.score ?? 0, minScore - 1);
      }

      const winnersPool = game.players.filter((p) => this.playerId(p) !== loserId);
      const winner =
        winnersPool.length > 0
          ? [...winnersPool].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
          : null;

      game.winnerId = winner ? this.playerId(winner) : null;
      game.loserId = loserId;
      game.loserTask = winner?.loserTask ?? null;
      game.stage = GameStages.GAME_RESULTS;
      game.stageStartedAt = Date.now();

      game.markModified('players');
      game.markModified('winnerId');
      game.markModified('loserId');
      game.markModified('loserTask');
      game.markModified('stage');
      game.markModified('stageStartedAt');
      await game.save();

      const updatedGame = await this.gameRepository.findByIdDocument(gameId);
      if (!updatedGame) throw new ApiError(404, 'GAME_AFTER_UPDATE_NOT_FOUND');
      const updatedGameobj = updatedGame.toObject();

      const diff = findDiff(gameSnapobj, updatedGameobj, GameStages.GAME_RESULTS);
      emitToRoom(this.io, gameId, SocketSystemEvents.STATUS_CHANGED, {
        ...buildStatePayload(GameMessageTypes.STAGE_CHANGED, diff),
        gameId,
        stage: GameStages.GAME_RESULTS,
        stageStartedAt: updatedGameobj.stageStartedAt ?? Date.now(),
        stageDurationMs: this.getStageDurationMs(GameStages.GAME_RESULTS),
        liarId: updatedGameobj.liarId ?? null,
        players: this.serializePlayersForClient(updatedGameobj),
        activeQuestion: updatedGameobj.activeQuestion ?? null,
        activeQuestionText: this.getActiveQuestionText(updatedGameobj),
        winnerId: updatedGameobj.winnerId ?? null,
        loserId: updatedGameobj.loserId ?? null,
        loserTask: updatedGameobj.loserTask ?? null,
      });

      this.scheduleStageTimer(gameId, GAME_STAGE_TIMER_MS, async () => {
        await this.nextStage({ gameId });
      });
    });
  }

  /**
   * Удаляет игру и очищает stage-таймер.
   */
  public async discardGame(dto: { gameId: string }): Promise<void> {
    const { gameId } = dto;
    this.clearStageTimer(gameId);
    await this.gameRepository.deleteById(gameId);
  }

  public async handleLobbyStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages> {
    logger.debug({ gameId }, 'Processing LOBBY stage');

    if (!game.players.every((p) => p.isReady)) throw new ApiError(400, 'NOT_ALL_PLAYERS_READY');

    const nextQuestion = this.pickNextQuestion(game);
    if (!nextQuestion) throw new ApiError(409, 'DECK_QUESTIONS_EXHAUSTED');

    game.activeQuestion = nextQuestion.id;
    game.stage = GameStages.LIAR_CHOOSES;
    game.questionHistory.push(nextQuestion.id);

    await this.chooseLiar(game);

    this.scheduleStageTimer(gameId, LIAR_CHOOSES_TIMER_MS, async () => {
      await this.nextStage({ gameId });
    });

    return GameStages.LIAR_CHOOSES;
  }

  public async handleLiarChoosesStage(
    game: HydratedDocument<Game>,
    gameId: string,
  ): Promise<GameStages> {
    logger.debug({ gameId }, 'Processing LIAR_CHOOSES stage');

    game.doLie ??= Math.random() < 0.5;

    const nextStage = GameStages.QUESTION_TO_LIAR;

    game.markModified('doLie');

    const questionToLiarStageMs =
      typeof game.settings?.answerTime === 'number' && game.settings.answerTime > 0
        ? game.settings.answerTime * 1000
        : GAME_STAGE_TIMER_MS;

    this.scheduleStageTimer(gameId, questionToLiarStageMs, async () => {
      await this.nextStage({ gameId: gameId });
    });

    return nextStage;
  }

  public async handleQuestionToLiarStage(
    game: HydratedDocument<Game>,
    gameId: string,
  ): Promise<GameStages> {
    logger.debug({ gameId }, 'Processing QUESTION_TO_LIAR stage');

    game.players.forEach((p) => {
      if (p.answer == null) p.answer = 2;
    });
    // На этапе оценки все игроки должны подтверждать готовность заново
    game.players.forEach((p) => {
      p.isConfirmed = false;
    });

    const nextStage = GameStages.QUESTION_RESULTS;

    game.markModified('players');

    this.scheduleStageTimer(gameId, GAME_STAGE_TIMER_MS, async () => {
      await this.nextStage({ gameId: gameId });
    });

    return nextStage;
  }

  public async handleQuestionResultsStage(
    game: HydratedDocument<Game>,
    gameId: string,
  ): Promise<GameStages> {
    logger.debug({ gameId, stage: game.stage }, 'Processing QUESTION_RESULTS stage');

    await this.calculateLiarPoints(game);
    await this.calculatePlayersPoints(game);
    await this.calculatePlayersPointsWithLikes(game);

    let nextStage: GameStages;
    if (game.questionHistory.length < game.settings.questionCount) {
      logger.debug(
        {
          questionHistoryLength: game.questionHistory.length,
          questionCount: game.settings.questionCount,
        },
        'Preparing next question',
      );
      const nextQuestion = this.pickNextQuestion(game);
      if (!nextQuestion) throw new ApiError(409, 'DECK_QUESTIONS_EXHAUSTED');

      game.activeQuestion = nextQuestion.id;
      game.questionHistory.push(nextQuestion.id);

      await this.chooseLiar(game);
      game.players.forEach((p) => {
        p.answer = null;
        p.isConfirmed = false;
        p.likes = 0;
      });
      game.roundLikePairs = [];
      game.doLie = null;
      nextStage = GameStages.LIAR_CHOOSES;

      game.markModified('players');
      game.markModified('roundLikePairs');
      game.markModified('doLie');

      this.scheduleStageTimer(gameId, GAME_STAGE_TIMER_MS, async () => {
        await this.nextStage({ gameId: gameId });
      });
    } else {
      const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

      const loser = sortedPlayers[sortedPlayers.length - 1];
      if (!loser) throw new ApiError(404, 'LOSER_NOT_FOUND');

      const winner = sortedPlayers[0];
      if (!winner) throw new ApiError(404, 'WINNER_NOT_FOUND');

      game.winnerId = this.playerId(winner);
      game.loserId = this.playerId(loser);
      game.loserTask = winner.loserTask;

      nextStage = GameStages.GAME_RESULTS;

      this.scheduleStageTimer(gameId, GAME_STAGE_TIMER_MS, async () => {
        await this.nextStage({ gameId: gameId });
      });
    }

    return nextStage;
  }

  public async handleGameResultsStage(
    game: HydratedDocument<Game>,
    gameId: string,
  ): Promise<GameStages> {
    logger.debug({ gameId }, 'Processing GAME_RESULTS stage');

    const nextStage = GameStages.END;

    this.scheduleStageTimer(gameId, GAME_STAGE_TIMER_MS, async () => {
      await this.nextStage({ gameId: gameId });
    });

    return nextStage;
  }

  public async handleEndStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages> {
    return GameStages.END;
  }

  /**
   * Выбор следующего вопроса
   * @param game mongoose-документ игры
   * @returns объект следующего вопроса
   */
  public pickNextQuestion(game: HydratedDocument<Game>): Question | undefined {
    return game.settings.deck.questions.find((q) => !game.questionHistory.includes(q.id));
  }

  /**
   * Функция выбора лжеца
   * @param game mongoose-документ игры
   */
  public async chooseLiar(game: HydratedDocument<Game>) {
    const minCount = Math.min(...game.players.map((p) => p.wasLiar ?? 0));

    const candidates = game.players.filter((p) => (p.wasLiar ?? 0) === minCount);
    const liar = candidates[Math.floor(Math.random() * candidates.length)];

    if (!liar) throw new ApiError(404, 'LIAR_NOT_FOUND');
    liar.wasLiar = (liar.wasLiar ?? 0) + 1;
    game.liarId = this.playerId(liar);

    game.markModified('players');
    game.markModified('liarId');
  }

  /**
   * Функция выбора ответа лжеца
   * @param dto DTO для выбора лжеца
   * @returns doLie будет врать или нет
   */
  public async liarChooses(dto: GameLiarChoosesDto) {
    const { gameId, playerId, answer } = dto;
    const game = await this.gameRepository.findByIdDocument(gameId);
    if (!game) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    if (game.stage !== GameStages.LIAR_CHOOSES) throw new ApiError(403, 'WRONG_STAGE');
    const liarMatch = this.findPlayerById(game, game.liarId ?? '');
    if (!game.liarId || !liarMatch || this.playerId(liarMatch) !== playerId)
      throw new ApiError(403, 'LIAR_CHOOSE_FORBIDDEN');

    game.doLie = answer;
    game.markModified('doLie');
    await game.save();

    await this.nextStage({ gameId });

    return game.doLie;
  }

  /**
   * Функция подсчёта очков лжецу
   * @param gameId id игры
   */
  public async calculateLiarPoints(game: HydratedDocument<Game>) {
    const liar = game.liarId ? this.findPlayerById(game, game.liarId) : null;
    if (!liar) throw new ApiError(404, 'LIAR_NOT_FOUND');

    game.players.forEach((player) => {
      if (this.playerId(player) === game.liarId) return;

      if (player.answer == 2) liar.score += SCORE_NOT_STATED;
      else if (player.answer != (game.doLie ? 1 : 0)) liar.score += SCORE_TRICKED;
    });

    game.markModified('players');
  }

  /**
   * Функция подсчёта очков игрокам
   * @param gameId id игры
   */
  public async calculatePlayersPoints(game: HydratedDocument<Game>) {
    const liar = game.liarId ? this.findPlayerById(game, game.liarId) : null;
    if (!liar) throw new ApiError(404, 'LIAR_NOT_FOUND');

    game.players.forEach((player) => {
      if (this.playerId(player) === game.liarId) return;

      if (player.answer == (game.doLie ? 1 : 0)) player.score += 200;
    });

    game.markModified('players');
  }

  /**
   * Функция подсчёта очков игрокам с учётом лайков
   * @param game mongoose-документ игры
   */
  public async calculatePlayersPointsWithLikes(game: HydratedDocument<Game>) {
    const liar = game.liarId ? this.findPlayerById(game, game.liarId) : null;
    if (!liar) throw new ApiError(404, 'LIAR_NOT_FOUND');

    game.players.forEach((player) => {
      if (this.playerId(player) === game.liarId) return;

      player.score += player.likes * 10;
    });

    game.markModified('players');
  }

  /**
   * Функция для лайка
   * @param dto DTO для лайка ответа игрока
   * @returns receiver объект Player получателя лайка
   */
  public async likeAnswer(dto: GamePlayerLikedDto): Promise<Player> {
    const { senderId, receiverId, gameId } = dto;
    if (receiverId == senderId) throw new ApiError(400, 'RECEIVER_EQUALS_SENDER_IDS');

    const game = await this.gameRepository.findByIdDocument(gameId);

    if (!game) throw new ApiError(404, 'LOBBY_NOT_FOUND');
    if (game.stage !== GameStages.QUESTION_RESULTS) throw new ApiError(403, 'WRONG_STAGE');
    if (receiverId === game.liarId) throw new ApiError(400, 'RECEIVER_EQUALS_LIAR_IDS');

    const sender = this.findPlayerById(game, senderId);

    if (!sender) throw new ApiError(404, 'SENDER_NOT_FOUND');
    if (sender.answer == 2) throw new ApiError(400, 'SENDER_DIDNT_ANSWER');

    const receiver = this.findPlayerById(game, receiverId);

    if (!receiver) throw new ApiError(404, 'RECEIVER_NOT_FOUND');
    const likePair = `${senderId}:${receiverId}`;
    game.roundLikePairs ??= [];
    if (game.roundLikePairs.includes(likePair)) throw new ApiError(409, 'LIKE_ALREADY_SENT');

    receiver.likes += 1;
    game.roundLikePairs.push(likePair);

    game.markModified('players');
    game.markModified('roundLikePairs');
    await game.save();

    return receiver;
  }

  /**
   * Функция чтобы задать ответ игроку
   * @param dto DTO для голосования игрока
   * @returns объект Player игрока, которому задали ответ
   */
  public async setAnswer(dto: GamePlayerVotedDto): Promise<Player> {
    const { gameId, playerId, answer } = dto;
    const game = await this.gameRepository.findByIdDocument(gameId);
    if (!game) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    if (game.stage != GameStages.QUESTION_TO_LIAR) throw new ApiError(403, 'WRONG_STAGE');

    const player = this.findPlayerById(game, playerId);
    if (!player) throw new ApiError(404, 'PLAYER_NOT_FOUND');
    if (game.liarId && this.playerId(player) === game.liarId)
      throw new ApiError(400, 'LIAR_CANNOT_VOTE');

    if (player.isConfirmed == true) throw new ApiError(400, 'ANSWER_ALREADY_CONFIRMED');

    player.answer = answer;

    game.markModified('players');
    await game.save();

    return player;
  }

  /**
   * Функция для фиксирования ответа
   * @param dto DTO для подтверждения ответа игрока
   * @returns объект Player игрока, которому зафиксировали ответ
   */
  public async confirmAnswer(dto: GamePlayerSecuredDto): Promise<Player> {
    const { gameId, playerId } = dto;
    const game = await this.gameRepository.findByIdDocument(gameId);
    if (!game) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    if (game.stage !== GameStages.QUESTION_TO_LIAR && game.stage !== GameStages.QUESTION_RESULTS) {
      throw new ApiError(403, 'WRONG_STAGE');
    }

    const player = this.findPlayerById(game, playerId);
    if (!player) throw new ApiError(404, 'PLAYER_NOT_FOUND');

    if (game.stage === GameStages.QUESTION_TO_LIAR) {
      if (game.liarId && this.playerId(player) === game.liarId)
        throw new ApiError(400, 'LIAR_CANNOT_SECURE');
      if (player.answer !== 0 && player.answer !== 1)
        throw new ApiError(400, 'PLAYER_DIDNT_ANSWER');
    }

    if (player.isConfirmed == true) throw new ApiError(400, 'ANSWER_ALREADY_CONFIRMED');
    player.isConfirmed = true;

    game.markModified('players');
    await game.save();

    // QUESTION_TO_LIAR: завершаем досрочно, когда все решалы зафиксировали ответы.
    if (game.stage === GameStages.QUESTION_TO_LIAR) {
      const liarId = game.liarId;
      const allResolversConfirmed = game.players
        .filter((p) => liarId == null || this.playerId(p) !== liarId)
        .every((p) => p.answer !== null && p.isConfirmed === true);

      if (allResolversConfirmed) {
        await this.nextStage({ gameId });
      }
    }

    // QUESTION_RESULTS: завершаем досрочно, когда все игроки нажали "Готово".
    if (game.stage === GameStages.QUESTION_RESULTS) {
      const allResolversConfirmed = game.players
        .filter((p) => game.liarId == null || this.playerId(p) !== game.liarId)
        .every((p) => p.isConfirmed === true);

      if (allResolversConfirmed) {
        await this.nextStage({ gameId });
      }
    }

    return player;
  }
}
