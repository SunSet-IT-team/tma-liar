import type { HydratedDocument } from 'mongoose';
import type { Question } from '../decks/entities/question.entity';
import type { Player } from '../lobby/entities/player.entity';
import { ApiError, buildStatePayload } from "../common/response";
import { LobbyModel } from "../lobby/lobby.model";
import { GameStages } from "../lobby/entities/lobby.entity";
import type { Game } from './entities/game.entity';
import { GameModel } from './game.model';
import type { GameStartDto } from './dtos/game-start.dto';
import type { GameNextStageDto } from './dtos/game-next-stage.dto';
import type { GamePlayerLikedDto } from './dtos/game-player-liked.dto';
import type { GamePlayerVotedDto } from './dtos/game-player-voted.dto';
import type { GamePlayerSecuredDto } from './dtos/game-player-secured.dto';
import type { GameLiarChoosesDto } from './dtos/game-liar-chooses.dto';
import type { Server } from 'socket.io';
import { findDiff } from '../common/diff';
import { GameMessageTypes } from '../../../common/message-types/game.types';
import { env } from '../config/env';

const SCORE_NOT_STATED = env.SCORE_NOT_STATED;
const SCORE_TRICKED = env.SCORE_TRICKED;
const GAME_STAGE_TIMER_MS = env.GAME_STAGE_TIMER_MS;

export interface GameMethods { 
  createGame: (dto: GameStartDto) => Promise<Game>,
  nextStage: (dto: GameNextStageDto) => Promise<GameStages>,
  likeAnswer: (dto: GamePlayerLikedDto) => Promise<Player>, 
  setAnswer: (dto: GamePlayerVotedDto) => Promise<Player>, 
}

export class GameService implements GameMethods { 
  constructor(private io: Server) {}
  /**
   * Функция поиска игры
   * @param gameId id игры
   * @returns 
   */  
  public async findGame(gameId: string): Promise<Game> {
    const game = await GameModel.findById(gameId).lean();
    if (!game) throw new ApiError(404, 'GAME_NOT_FOUND');

    return game;
  }

    /** 
     * Создать игру 
     * 
     */
  public async createGame( dto: GameStartDto ): Promise<Game> {
    const lobby = await LobbyModel.findOne({ lobbyCode: dto.lobbyCode }).lean();
    if (!lobby) throw new ApiError(400, "LOBBY_NOT_FOUND");

    if (dto.player.id !== lobby.adminId) throw new ApiError(400, "PLAYER_IS_NOT_ADMIN");

    const playersInGame = lobby.players;

    const game = await GameModel.create({lobbyCode: dto.lobbyCode, players: playersInGame, settings: lobby.settings});

    if (!game) throw new ApiError(400, 'LOBBY_NOT_CREATED');
    return game.toObject();
  }

  /**
   * Функция для смены стадии и основного процесса игры 
   * @param dto DTO для перехода на следующую стадию
   */ 
  public async nextStage(dto: GameNextStageDto): Promise<GameStages> {
    const { gameId } = dto;
    const game = await GameModel.findById(gameId);
    if (!game) throw new ApiError(404, 'GAME_NOT_FOUND');

    const gameSnapobj = game.toObject();
    
    if (game.timerId) {
      clearTimeout(game.timerId);
      game.timerId = null;
    }

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

    game.markModified('stage');
    await game.save();
    
    const updatedGame = await GameModel.findById(gameId);
    if(!updatedGame) throw new ApiError(404, 'GAME_AFTER_UPDATE_NOT_FOUND');
    const updatedGameobj = updatedGame.toObject();

    const diff = findDiff(gameSnapobj, updatedGameobj, nextStage);
    console.log(`[nextStage] Emitting stage change: ${currentStage} → ${nextStage}, diff keys: ${Object.keys(diff).join(", ")}`);
    
    this.io.to(gameId).emit("changeGameStatus", buildStatePayload(GameMessageTypes.STAGE_CHANGED, diff));

    return nextStage;
  }

  public async handleLobbyStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages> {
    console.log('on stage lobby');

    if (!game.players.every(p => p.isReady)) throw new ApiError(400, 'NOT_ALL_PLAYERS_READY');

    const nextQuestion = this.pickNextQuestion(game);
    if (!nextQuestion) game.questionHistory = [];
    

    game.activeQuestion = nextQuestion.id;
    game.stage = GameStages.LIAR_CHOOSES;
    game.questionHistory.push(nextQuestion.id);

    await this.chooseLiar(game);

    game.timerId = this.resolveTimer(GAME_STAGE_TIMER_MS, async () => {
      await this.nextStage({ gameId });
    });

    return GameStages.LIAR_CHOOSES;
  }

  
  public async handleLiarChoosesStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages>{ 
    console.log('on stage liar chooses');

    game.doLie ??= Math.random() < 0.5;

    const nextStage = GameStages.QUESTION_TO_LIAR;

    game.markModified('doLie');

    game.timerId = this.resolveTimer(GAME_STAGE_TIMER_MS, async () => { 
      await this.nextStage({ gameId: gameId }) 
    });

    return nextStage;
  }

  public async handleQuestionToLiarStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages>{ 
    console.log('on stage question to liar');

    game.players.forEach(p => { if (p.answer == null) p.answer = 2 });

    const nextStage = GameStages.QUESTION_RESULTS;

    game.markModified('players');

    game.timerId = this.resolveTimer(GAME_STAGE_TIMER_MS, async () => { 
      await this.nextStage({ gameId: gameId }) 
    });

    return nextStage;
  }

  public async handleQuestionResultsStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages>{ 
    console.log(`[handleQuestionResultsStage] Processing stage: ${game.stage}`);

    await this.calculateLiarPoints(game);
    await this.calculatePlayersPoints(game);
    await this.calculatePlayersPointsWithLikes(game);

    let nextStage : GameStages;
    if (game.questionHistory.length < game.settings.questionCount) {
      console.log(game.questionHistory.length);
      console.log(game.settings.questionCount);
      const nextQuestion = this.pickNextQuestion(game);

      game.activeQuestion = nextQuestion.content;
      game.questionHistory.push(nextQuestion.id);
      
      await this.chooseLiar(game);
      game.players.forEach(p => { p.answer = null; p.isConfirmed == null });
      game.doLie = null;
      nextStage = GameStages.LIAR_CHOOSES;

      game.markModified('players');
      game.markModified('doLie');

      game.timerId = this.resolveTimer(GAME_STAGE_TIMER_MS, async () => { 
        await this.nextStage({ gameId: gameId }) 
      });
    } else {
      const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

      const loser = sortedPlayers[sortedPlayers.length - 1];
      if(!loser) throw new ApiError(404, 'LOSER_NOT_FOUND')

      const winner = sortedPlayers[0];
      if(!winner) throw new ApiError(404, 'WINNER_NOT_FOUND')
        
      game.winnerId = winner.id;
      game.loserId = loser.id;  
      game.loserTask = winner.loserTask;

      nextStage = GameStages.GAME_RESULTS;

      game.timerId = this.resolveTimer(GAME_STAGE_TIMER_MS, async () => { 
        await this.nextStage({ gameId: gameId }) 
      });
    }
    
    return nextStage;
  }

  public async handleGameResultsStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages>{ 
    console.log('on stage game results');
    
    const nextStage = GameStages.END;

    game.timerId = this.resolveTimer(GAME_STAGE_TIMER_MS, async () => { 
      await this.nextStage({ gameId: gameId }) 
    });

    return nextStage;
  }

  public async handleEndStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages>{ 
    return GameStages.END;
  }

  /**
   * Выбор следующего вопроса
   * @param game mongoose-документ игры
   * @returns объект следующего вопроса
   */
  public pickNextQuestion(game: HydratedDocument<Game>): Question {
    return game.settings.deck.questions.find(q => !game.questionHistory.includes(q.id))!;
  }
  
  /**
   * Функция выбора лжеца 
   * @param game mongoose-документ игры
   */
  public async chooseLiar(game: HydratedDocument<Game>) {
    const minCount = Math.min(...game.players.map(p => p.wasLiar!));
 
    const candidates = game.players.filter(p => p.wasLiar === minCount);
    const liar = candidates[Math.floor(Math.random() * candidates.length)];
    
    if(!liar) throw new ApiError(404, 'LIAR_NOT_FOUND');
    liar.wasLiar += 1;
    game.liarId = liar.id;

    game.markModified('players');
    game.markModified('liarId');
  }

  /**
   * Функция выбора ответа лжеца 
   * @param dto DTO для выбора лжеца
   * @returns doLie будет врать или нет
   */
  public async liarChooses(dto: GameLiarChoosesDto) {
    const { gameId, answer } = dto;
    const game = await GameModel.findById(gameId);
    if (!game) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    if(game.stage != GameStages.QUESTION_TO_LIAR) throw new ApiError(403, 'WRONG_STAGE');

    game.doLie = answer;
    game.markModified('doLie');

    await this.nextStage({ gameId });

    return game.doLie;
  }

  /**
   * Функция подсчёта очков лжецу 
   * @param gameId id игры 
   */
  public async calculateLiarPoints(game: HydratedDocument<Game>) { 
    const liar = game.players.find(p => p.id == game.liarId);
    if(!liar) throw new ApiError(404, 'LIAR_NOT_FOUND')

    game.players.forEach(player => {
      if(player.id == game.liarId) return;

      if(player.answer == 2) liar.score += SCORE_NOT_STATED;
      else if(player.answer != (game.doLie ? 1 : 0)) liar.score += SCORE_TRICKED;
    });

    game.markModified('players');

  }

  /**
   * Функция подсчёта очков игрокам 
   * @param gameId id игры 
   */
  public async calculatePlayersPoints(game: HydratedDocument<Game>) { 
    const liar = game.players.find(p => p.id == game.liarId);
    if(!liar) throw new ApiError(404, 'LIAR_NOT_FOUND')

    game.players.forEach(player => {
      if(player.id == game.liarId) return;

      if(player.answer == (game.doLie ? 1 : 0)) player.score += 200;
    });

    game.markModified('players');
  }  

  /**
   * Функция подсчёта очков игрокам с учётом лайков 
   * @param game mongoose-документ игры
   */
  public async calculatePlayersPointsWithLikes(game: HydratedDocument<Game>) { 
    const liar = game.players.find(p => p.id == game.liarId);
    if(!liar) throw new ApiError(404, 'LIAR_NOT_FOUND')

    game.players.forEach(player => {
      if(player.id == game.liarId) return;

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
    if(receiverId == senderId) throw new ApiError(400, 'RECEIVER_EQUALS_SENDER_IDS');

    const game = await GameModel.findById(gameId);
    
    if(!game) throw new ApiError(404, 'LOBBY_NOT_FOUND');
    if(game.stage != GameStages.QUESTION_RESULTS && game.stage != GameStages.GAME_RESULTS) throw new ApiError(403, 'WRONG_STAGE');
    if(receiverId == game.liarId) throw new ApiError(400, 'RECEIVER_EQUALS_LIAR_IDS');

    const sender = game.players.find(p => p.id == senderId);
    
    if(!sender) throw new ApiError(404, 'SENDER_NOT_FOUND');
    if(sender.answer == 2) throw new ApiError(400, 'SENDER_DIDNT_ANSWER'); 

    const receiver = game.players.find(p => p.id == receiverId);

    if(!receiver) throw new ApiError(404, 'RECEIVER_NOT_FOUND');

    receiver.likes += 1;

    game.markModified('players');
    await game.save();

    return receiver; 
  }

  /**
   * Функция чтобы задать ответ игроку 
   * @param dto DTO для голосования игрока
   * @returns объект Player игрока, которому задали ответ
   */
  public async setAnswer(dto: GamePlayerVotedDto): Promise<Player>{ 
    const { gameId, playerId, answer } = dto;
    const game = await GameModel.findById(gameId); 
    if(!game) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    if(game.stage != GameStages.QUESTION_TO_LIAR) throw new ApiError(403, 'WRONG_STAGE');

    const player = game.players.find(p => p.id == playerId);
    if(!player) throw new ApiError(404, 'PLAYER_NOT_FOUND');

    if(player.isConfirmed == true) throw new ApiError(400, 'ANSWER_ALREADY_CONFIRMED');
    
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
  public async confirmAnswer(dto: GamePlayerSecuredDto): Promise<Player>{ 
    const { gameId, playerId } = dto;
    const game = await GameModel.findById(gameId); 
    if(!game) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    if(game.stage != GameStages.QUESTION_RESULTS && game.stage != GameStages.GAME_RESULTS) throw new ApiError(403, 'WRONG_STAGE');

    const player = game.players.find(p => p.id == playerId);
    if(!player) throw new ApiError(404, 'PLAYER_NOT_FOUND');

    if(player.answer == 2) throw new ApiError(400, 'PLAYER_DIDNT_ANSWER'); 

    if(player.isConfirmed == true) throw new ApiError(400, 'ANSWER_ALREADY_CONFIRMED'); 
    player.isConfirmed = true;

    game.markModified('players');
    await game.save();

    return player;
  }

  public resolveTimer(time: number, callback: () => void) {
    return setTimeout(callback, time);
  }
}
