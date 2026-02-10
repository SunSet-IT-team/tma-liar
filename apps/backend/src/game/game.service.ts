import type { HydratedDocument } from 'mongoose';
import type { Lobby } from '../lobby/entities/lobby.entity';
import type { Question } from '../decks/entities/question.entity';
import type { Player } from '../lobby/entities/player.entity';
import { ApiError } from "../common/response";
import { LobbyModel } from "../lobby/lobby.model";
import { GameStages } from "../lobby/entities/lobby.entity";
import type { 
  GameLikeAnswerParams,
  GameNextStageParams,
  GameSetAnswerParams,
  GameStartParams
} from "./game.params";
import type { Game } from './entities/game.entity';
import { GameModel } from './game.model';

export interface GameMethods { 
  startGame: (param: GameStartParams) => Promise<Game>,
  nextStage: (param: GameNextStageParams) => Promise<GameStages>,
  likeAnswer: (param: GameLikeAnswerParams) => Promise<Player>, 
  setAnswer: (param: GameSetAnswerParams) => Promise<Player>, 
}

// Очки в случае если ответ "не определено"
const SCORE_NOT_STATED = 50;

// Очки в случае если лжецу удалось обмануть
const SCORE_TRICKED = 100;

//Время таймера 
const TIMER = 10000

export class GameService implements GameMethods { 



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
   * Функция для начала игры
   * @param lobbyId айди лобби
   * @param stage стадия игры
   * @param players массив игроков в игре
   * @param settings настройки игры
   * @param liarId айди лжеца
   * @param questionHistory массив id истории вопросов
   * @param activeQuestion активный вопрос
   * @param timerId айди таймера
   * @param doLie флаг, указывающий, лжет ли игрок
   * @param loserTask задание для проигравшего
   * @param winnerId айди победителя
   * @param loserId айди проигравшего
   */
  public async startGame(param: GameStartParams): Promise<Game> {
    const game = await GameModel.create(param); 
    if(!game) throw new ApiError(400, 'GAME_NOT_CREATED');

    await this.nextStage( {gameId: String(game._id)} );
    return game.toObject();
  }

  /**
   * Функция для смены стадии и основного процесса игры 
   * @param gameId id игры
   */ 
  public async nextStage(param: GameNextStageParams): Promise<GameStages> {
    const { gameId } = param;
    const game = await GameModel.findById(gameId);
      if (!game) throw new ApiError(404, 'GAME_NOT_FOUND');

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

    game.timerId = this.resolveTimer(TIMER, async () => {
      await this.nextStage({ gameId });
    });

    return GameStages.LIAR_CHOOSES;
  }

  
  public async handleLiarChoosesStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages>{ 
    console.log('on stage liar chooses');

    game.doLie ??= Math.random() < 0.5;

    const nextStage = GameStages.QUESTION_TO_LIAR;

    game.markModified('doLie');

    game.timerId = this.resolveTimer(TIMER, async () => { 
      await this.nextStage({ gameId: gameId }) 
    });

    return nextStage;
  }

  public async handleQuestionToLiarStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages>{ 
    console.log('on stage question to liar');

    game.players.forEach(p => { if (p.answer == null) p.answer = 2 });

    const nextStage = GameStages.QUESTION_RESULTS;

    game.markModified('players');

    game.timerId = this.resolveTimer(TIMER, async () => { 
      await this.nextStage({ gameId: gameId }) 
    });

    return nextStage;
  }

  public async handleQuestionResultsStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages>{ 
    console.log('on stage question results');

    await this.calculateLiarPoints(game);
    await this.calculatePlayersPoints(game);
    await this.calculatePlayersPointsWithLikes(game);

    let nextStage : GameStages;
    if (game.questionHistory.length < game.settings.questionCount) {
      const nextQuestion = this.pickNextQuestion(game);

      game.activeQuestion = nextQuestion.content;
      game.questionHistory.push(nextQuestion.id);
      
      await this.chooseLiar(game);
      game.players.forEach(p => { p.answer = null; p.secure == null });
      game.doLie = null;
      nextStage = GameStages.LIAR_CHOOSES;

      game.markModified('players');
      game.markModified('doLie');

      game.timerId = this.resolveTimer(TIMER, async () => { 
        await this.nextStage({ gameId: gameId }) 
      });
    } else {
      const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

      const loser = sortedPlayers[sortedPlayers.length - 1];
      if(!loser) throw new ApiError(400, 'LOSER_NOT_FOUND')

      const winner = sortedPlayers[0];
      if(!winner) throw new ApiError(400, 'WINNER_NOT_FOUND')
        
      game.winnerId = winner.telegramId;
      game.loserId = loser.telegramId;  
      game.loserTask = winner.loserTask;

      nextStage = GameStages.GAME_RESULTS;
    }
    
    return nextStage;
  }

  public async handleGameResultsStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages>{ 
    const nextStage = GameStages.END;
    
    return nextStage;
  }

  public async handleEndStage(game: HydratedDocument<Game>, gameId: string): Promise<GameStages>{ 
    const nextStage = GameStages.END;
    
    return nextStage;
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
    
    if(!liar) throw new ApiError(400, 'LIAR_NOT_FOUND');
    liar.wasLiar += 1;
    game.liarId = liar.telegramId;

    game.markModified('players');
    game.markModified('liarId');
  }

  /**
   * Функция выбора ответа лжеца 
   * @param gameId id игры 
   * @param answer ответ (будет врать - true, не будет - false)
   * @returns doLie будет врать или нет
   */
  public async liarChooses(gameId: string, answer: boolean) {
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
    const liar = game.players.find(p => p.telegramId == game.liarId);
    if(!liar) throw new ApiError(400, 'LIAR_NOT_FOUND')

    game.players.forEach(player => {
      if(player.telegramId == game.liarId) return;

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
    const liar = game.players.find(p => p.telegramId == game.liarId);
    if(!liar) throw new ApiError(400, 'LIAR_NOT_FOUND')

    game.players.forEach(player => {
      if(player.telegramId == game.liarId) return;

      if(player.answer == (game.doLie ? 1 : 0)) player.score += 200;
    });

    game.markModified('players');
  }  

  /**
   * Функция подсчёта очков игрокам с учётом лайков 
   * @param game mongoose-документ игры
   */
  public async calculatePlayersPointsWithLikes(game: HydratedDocument<Game>) { 
    const liar = game.players.find(p => p.telegramId == game.liarId);
    if(!liar) throw new ApiError(400, 'LIAR_NOT_FOUND')

    game.players.forEach(player => {
      if(player.telegramId == game.liarId) return;

      player.score += player.likes * 10;
    });

    game.markModified('players');
  }   

  /**
   * Функция для лайка
   * @param senderId id отправителя лайка
   * @param receiverId id получателя лайка
   * @param gameId id игры
   * @returns receiver объект Player получателя лайка
   */
  public async likeAnswer(param: GameLikeAnswerParams): Promise<Player> {
    if(param.receiverId == param.senderId) throw new ApiError(400, 'RECEIVER_EQUALS_SENDER_IDS');

    const game = await GameModel.findById(param.gameId);
    
    if(!game) throw new ApiError(400, 'LOBBY_NOT_FOUND');
    if(game.stage != GameStages.QUESTION_RESULTS && game.stage != GameStages.GAME_RESULTS) throw new ApiError(403, 'WRONG_STAGE');
    if(param?.receiverId == game.liarId) throw new ApiError(400, 'RECEIVER_EQUALS_LIAR_IDS');

    const sender = game.players.find(p => p.telegramId == param.senderId);
    
    if(!sender) throw new ApiError(400, 'SENDER_NOT_FOUND');
    if(sender.answer == 2) throw new ApiError(400, 'SENDER_DIDNT_ANSWER'); 

    const receiver = game.players.find(p => p.telegramId == param.receiverId);

    if(!receiver) throw new ApiError(400, 'RECEIVER_NOT_FOUND');

    receiver.likes += 1;

    game.markModified('players');
    await game.save();

    return receiver; 
  }

  /**
   * Функция чтобы задать ответ игроку 
   * @param gameId код лобби
   * @param playerId tg id игрока
   * @param answer ответ (число: 0 - не верит, 1 - верит, 2 - не определился)
   * @returns объект Player игрока, которому задали ответ
   */
  public async setAnswer(param: GameSetAnswerParams): Promise<Player>{ 
    const game = await GameModel.findById(param.gameId); 
    if(!game) throw new ApiError(400, 'LOBBY_NOT_FOUND');

    if(game.stage != GameStages.QUESTION_TO_LIAR) throw new ApiError(403, 'WRONG_STAGE');

    const player = game.players.find(p => p.telegramId == param.playerId);
    if(!player) throw new ApiError(400, 'PLAYER_NOT_FOUND');

    if(player.secure == true) throw new ApiError(400, 'ANSWER_ALREADY_CONFIRMED');
    
    player.answer = param.answer;

    game.markModified('players');
    await game.save();

    return player;
  }

  /**
   * Функция для фиксирования ответа
   * @param gameId id игры
   * @param playerId tg id игрока, которому фиксируем ответ
   * @returns объект Player игрока, которому зафиксировали ответ
   */
  public async confirmAnswer(gameId: string, playerId: string): Promise<Player>{ 
    const game = await GameModel.findById(gameId); 
    if(!game) throw new ApiError(400, 'LOBBY_NOT_FOUND');

    if(game.stage != GameStages.QUESTION_RESULTS && game.stage != GameStages.GAME_RESULTS) throw new ApiError(403, 'WRONG_STAGE');

    const player = game.players.find(p => p.telegramId == playerId);
    if(!player) throw new ApiError(400, 'PLAYER_NOT_FOUND');

    if(player.answer == 2) throw new ApiError(400, 'PLAYER_DIDNT_ANSWER'); 

    if(player.secure == true) throw new ApiError(400, 'ALREADY_SECURED'); 
    player.secure = true;

    game.markModified('players');
    await game.save();

    return player;
  }

  public resolveTimer(time: number, callback: () => void) {
    return setTimeout(callback, time);
  }
}
