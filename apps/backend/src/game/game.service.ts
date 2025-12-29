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
  GameSetAnswerParams
} from "./game.params";

export interface GameMethods { 
  nextStage: (param?: GameNextStageParams) => Promise<GameStages>,
  likeAnswer: (param?: GameLikeAnswerParams) => Promise<Player>, 
  setAnswer: (param?: GameSetAnswerParams) => Promise<Player>, 
}

export class Game implements GameMethods { 
  /**
   * Функция для смены стадии и основного процесса игры 
   * @param lobbyCode код лобби
   */ 
  public async nextStage(param?: GameNextStageParams): Promise<GameStages> {
    if(!param?.lobbyCode) throw new ApiError(404, "LOBBY_NOT_FOUND");
    const { lobbyCode } = param;

    const lobby = await LobbyModel.findOne({ lobbyCode });
    if (!lobby) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    if (lobby.timerId) {
      clearTimeout(lobby.timerId);
      lobby.timerId = null;
    }

    const currentStage = lobby.stage as GameStages;

    let nextStage: GameStages;

    switch (currentStage) {
      case GameStages.LOBBY:
        nextStage = await this.handleLobbyStage(lobby, lobbyCode);
        break;

      case GameStages.LIAR_CHOOSES:
        nextStage = await this.handleLiarChoosesStage(lobby, lobbyCode);
        break;

      case GameStages.QUESTION_TO_LIAR:
        nextStage = await this.handleQuestionToLiarStage(lobby, lobbyCode);
        break;

      case GameStages.QUESTION_RESULTS:
        nextStage = await this.handleQuestionResultsStage(lobby, lobbyCode);
        break;

      case GameStages.GAME_RESULTS:
        nextStage = await this.handleGameResultsStage(lobby, lobbyCode);
        break;

      case GameStages.END:
        nextStage = await this.handleEndStage(lobby, lobbyCode);
        break;

      default:
        throw new ApiError(400, 'UNKNOWN_STAGE');
    }

    lobby.stage = nextStage;

    lobby.markModified('stage');
    await lobby.save();

    return nextStage;
  }

  public async handleLobbyStage(lobby: HydratedDocument<Lobby>, lobbyCode: string): Promise<GameStages> {
    console.log('on stage lobby');

    if (!lobby.players.every(p => p.isReady)) throw new ApiError(400, 'NOT_ALL_PLAYERS_READY');

    const nextQuestion = this.pickNextQuestion(lobby);
    if (!nextQuestion) throw new ApiError(400, 'NO_QUESTIONS_LEFT');

    const updatedLobby = await LobbyModel.findOneAndUpdate(
      { lobbyCode },
      {
        $set: {
          activeQuestion: nextQuestion,
          stage: GameStages.LIAR_CHOOSES
        },
        $push: { questionHistory: nextQuestion.id }
      },
      { new: true }
    );

    if (!updatedLobby) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    await this.chooseLiar(updatedLobby);

    updatedLobby.timerId = this.resolveTimer(10000, async () => {
      await this.nextStage({ lobbyCode });
    });

    return GameStages.LIAR_CHOOSES;
  }

  
  public async handleLiarChoosesStage(lobby: HydratedDocument<Lobby>, lobbyCode: string): Promise<GameStages>{ 
    console.log('on stage liar chooses');

    lobby.doLie ??= Math.random() < 0.5;

    const nextStage = GameStages.QUESTION_TO_LIAR;

    lobby.markModified('doLie');

    lobby.timerId = this.resolveTimer(lobby.settings.answerTime, async () => { 
      await this.nextStage({ lobbyCode: lobbyCode }) 
    });

    return nextStage;
  }

  public async handleQuestionToLiarStage(lobby: HydratedDocument<Lobby>, lobbyCode: string): Promise<GameStages>{ 
    console.log('on stage question to liar');

    lobby.players.forEach(p => { if (p.answer == null) p.answer = 2 });

    const nextStage = GameStages.QUESTION_RESULTS;

    lobby.markModified('players');

    lobby.timerId = this.resolveTimer(10000, async () => { 
      await this.nextStage({ lobbyCode: lobbyCode }) 
    });

    return nextStage;
  }

  public async handleQuestionResultsStage(lobby: HydratedDocument<Lobby>, lobbyCode: string): Promise<GameStages>{ 
    console.log('on stage question results');

    await this.calculateLiarPoints(lobby);
    await this.calculatePlayersPoints(lobby);
    await this.calculatePlayersPointsWithLikes(lobby);

    let nextStage : GameStages;
    if (lobby.questionHistory.length < lobby.settings.questionCount) {
      const nextQuestion = this.pickNextQuestion(lobby);

      lobby.activeQuestion = nextQuestion;
      lobby.questionHistory.push(nextQuestion.id);
      
      await this.chooseLiar(lobby);
      lobby.players.forEach(p => { p.answer = null; p.secure == null });
      lobby.doLie = null;
      nextStage = GameStages.LIAR_CHOOSES;

      lobby.markModified('players');
      lobby.markModified('doLie');

      lobby.timerId = this.resolveTimer(10000, async () => { 
        await this.nextStage({ lobbyCode: lobbyCode }) 
      });
    } else {
      const sortedPlayers = [...lobby.players].sort((a, b) => b.score - a.score);

      const loser = sortedPlayers[sortedPlayers.length - 1];
      if(!loser) throw new ApiError(400, 'LOSER_NOT_FOUND')

      const winner = sortedPlayers[0];
      if(!winner) throw new ApiError(400, 'WINNER_NOT_FOUND')
        
      lobby.winnerId = winner.telegramId;
      lobby.loserId = loser.telegramId;  
      lobby.loserTask = winner.loserTask;

      await lobby.save();

      nextStage = GameStages.GAME_RESULTS;
    }
    
    return nextStage;
  }

  public async handleGameResultsStage(lobby: HydratedDocument<Lobby>, lobbyCode: string): Promise<GameStages>{ 
    const nextStage = GameStages.END;
    
    return nextStage;
  }

  public async handleEndStage(lobby: HydratedDocument<Lobby>, lobbyCode: string): Promise<GameStages>{ 
    const nextStage = GameStages.END;
    
    return nextStage;
  }

  /**
   * Выбор следующего вопроса
   * @param lobby mongoose-документ лоббт
   * @returns объект следующего вопроса
   */
  public pickNextQuestion(lobby: HydratedDocument<Lobby>): Question {
    return lobby.settings.deck.questions.find(q => !lobby.questionHistory.includes(q.id))!;
  }
  
  /**
   * Функция выбора лжеца 
   * @param lobby mongoose-документ лобби
   */
  public async chooseLiar(lobby: HydratedDocument<Lobby>) {
    const minCount = Math.min(...lobby.players.map(p => p.wasLiar!));
 
    const candidates = lobby.players.filter(p => p.wasLiar === minCount);
    const liar = candidates[Math.floor(Math.random() * candidates.length)];
    
    if(!liar) throw new ApiError(400, 'LIAR_NOT_FOUND');
    liar.wasLiar += 1;
    lobby.liarId = liar.telegramId;

    lobby.markModified('players');
    lobby.markModified('liarId');

    await lobby.save();
  }

  /**
   * Функция выбора ответа лжеца 
   * @param lobbyCode код лобби
   * @param answer ответ (будет врать - true, не будет - false)
   * @returns doLie будет врать или нет
   */
  public async liarChooses(lobbyCode: string, answer: boolean) {
    const lobby = await LobbyModel.findOne({ lobbyCode });
    if (!lobby) throw new ApiError(404, 'LOBBY_NOT_FOUND');

    if(lobby.stage != GameStages.QUESTION_TO_LIAR) throw new ApiError(403, 'WRONG_STAGE');

    lobby.doLie = answer;

    lobby.markModified('doLie');

    await lobby.save();

    await this.nextStage({ lobbyCode });

    return lobby.doLie;
  }

  /**
   * Функция подсчёта очков лжецу 
   * @param lobby mongoose-документ лобби
   */
  public async calculateLiarPoints(lobby: HydratedDocument<Lobby>) { 
    const liar = lobby.players.find(p => p.telegramId == lobby.liarId);
    if(!liar) throw new ApiError(400, 'LIAR_NOT_FOUND')

    lobby.players.forEach(player => {
      if(player.telegramId == lobby.liarId) return;

      if(player.answer == 2) liar.score += 50;
      else if(player.answer != (lobby.doLie ? 1 : 0)) liar.score += 100;
    });

    lobby.markModified('players');

  }

  /**
   * Функция подсчёта очков игрокам 
   * @param lobby mongoose-документ лобби
   */
  public async calculatePlayersPoints(lobby: HydratedDocument<Lobby>) { 
    const liar = lobby.players.find(p => p.telegramId == lobby.liarId);
    if(!liar) throw new ApiError(400, 'LIAR_NOT_FOUND')

    lobby.players.forEach(player => {
      if(player.telegramId == lobby.liarId) return;

      if(player.answer == (lobby.doLie ? 1 : 0)) player.score += 200;
    });

    lobby.markModified('players');
  }  

  /**
   * Функция подсчёта очков игрокам с учётом лайков 
   * @param lobby mongoose-документ лобби
   */
  public async calculatePlayersPointsWithLikes(lobby: HydratedDocument<Lobby>) { 
    const liar = lobby.players.find(p => p.telegramId == lobby.liarId);
    if(!liar) throw new ApiError(400, 'LIAR_NOT_FOUND')

    lobby.players.forEach(player => {
      if(player.telegramId == lobby.liarId) return;

      player.score += player.likes * 10;
    });

    lobby.markModified('players');
  }   

  /**
   * Функция для лайка
   * @param senderId tg id отправителя лайка
   * @param receiverId tg id получателя лайка
   * @param lobbyCode код лобби
   * @returns receiver объект Player получателя лайка
   */
  public async likeAnswer(param?: GameLikeAnswerParams): Promise<Player> {
    if(param?.receiverId == param?.senderId) throw new ApiError(400, 'RECEIVER_EQUALS_SENDER_IDS');
    if (!param?.lobbyCode) throw new ApiError(400, 'LOBBY_CODE_NOT_SET');

    const lobby = await LobbyModel.findOne({ lobbyCode: param?.lobbyCode });
    
    if(!lobby) throw new ApiError(400, 'LOBBY_NOT_FOUND');
    if(lobby.stage != GameStages.QUESTION_RESULTS && lobby.stage != GameStages.GAME_RESULTS) throw new ApiError(403, 'WRONG_STAGE');
    if(param?.receiverId == lobby.liarId) throw new ApiError(400, 'RECEIVER_EQUALS_LIAR_IDS');

    const sender = lobby.players.find(p => p.telegramId == param?.senderId);
    
    if(!sender) throw new ApiError(400, 'SENDER_NOT_FOUND');
    if(sender.answer == 2) throw new ApiError(400, 'SENDER_DIDNT_ANSWER'); 

    const receiver = lobby.players.find(p => p.telegramId == param?.receiverId);

    if(!receiver) throw new ApiError(400, 'RECEIVER_NOT_FOUND');

    receiver.likes += 1;

    lobby.markModified('players');
    await lobby.save();

    return receiver; 
  }

  /**
   * Функция чтобы задать ответ игроку 
   * @param lobbyCode код лобби
   * @param telegramId tg id игрока
   * @param answer ответ (число: 0 - не верит, 1 - верит, 2 - не определился)
   * @returns объект Player игрока, которому задали ответ
   */
  public async setAnswer(param?: GameSetAnswerParams): Promise<Player>{ 
    const lobby = await LobbyModel.findOne({ lobbyCode: param?.lobbyCode }); 
    if(!lobby) throw new ApiError(400, 'LOBBY_NOT_FOUND');

    if(lobby.stage != GameStages.QUESTION_TO_LIAR) throw new ApiError(403, 'WRONG_STAGE');

    const player = lobby.players.find(p => p.telegramId == param?.telegramId);
    if(!player) throw new ApiError(400, 'PLAYER_NOT_FOUND');

    if(param?.answer == null) throw new ApiError(400, 'ANSWER_NOT_FOUND');
    if(player.secure == true) throw new ApiError(400, 'ANSWER_ALREADY_SECURED');
    
    player.answer = param?.answer;

    lobby.markModified('players');
    await lobby.save();

    return player;
  }

  /**
   * Функция для фиксирования ответа
   * @param lobbyCode код лобби
   * @param telegramId tg id игрока, которому фиксируем ответ
   * @returns объект Player игрока, которому зафиксировали ответ
   */
  public async secureAnswer(lobbyCode: string, telegramId: string): Promise<Player>{ 
    const lobby = await LobbyModel.findOne({ lobbyCode: lobbyCode }); 
    if(!lobby) throw new ApiError(400, 'LOBBY_NOT_FOUND');

    if(lobby.stage != GameStages.QUESTION_RESULTS && lobby.stage != GameStages.GAME_RESULTS) throw new ApiError(403, 'WRONG_STAGE');

    const player = lobby.players.find(p => p.telegramId == telegramId);
    if(!player) throw new ApiError(400, 'PLAYER_NOT_FOUND');

    if(player.answer == 2) throw new ApiError(400, 'PLAYER_DIDNT_ANSWER'); 

    if(player.secure == true) throw new ApiError(400, 'ALREADY_SECURED'); 
    player.secure = true;

    lobby.markModified('players');
    await lobby.save();

    return player;
  }

  public resolveTimer(time: number, callback: () => void) {
    return setTimeout(callback, time);
  }
}
