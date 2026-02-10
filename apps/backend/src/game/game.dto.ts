import type { 
    GameStartParams,
    GameLikeAnswerParams,
    GameNextStageParams,
    GameSetAnswerParams, 
    GameLiarChoosesParams,
    GameConfirmAnswerParams
} from "./game.params";
import type { GameStages } from "../lobby/entities/lobby.entity";
import type { Player } from "../lobby/entities/player.entity";
import type { Settings } from "../lobby/entities/settings.entity";

/**DTO для лобби */

/**
 * DTO для StartGame
 * @param lobbyId id лобби игры
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
export class StartGameDto { 
    lobbyId: string;
    stage: GameStages;
    players: Player[] | [];
    settings: Settings; 
    liarId: string | null;
    questionHistory: string[];
    activeQuestion: string | null;
    timerId: NodeJS.Timeout | null;
    doLie: boolean | null;
    loserTask: string | null;
    winnerId: string | null;
    loserId: string | null;

    constructor(data: GameStartParams) { 
        this.lobbyId = data.lobbyId;
        this.stage = data.stage;
        this.players = data.players;
        this.settings = data.settings;
        this.liarId = data.liarId;
        this.questionHistory = data.questionHistory;
        this.activeQuestion = data.activeQuestion;
        this.timerId = data.timerId;
        this.doLie = data.doLie;
        this.loserTask = data.loserTask;
        this.winnerId = data.winnerId;
        this.loserId = data.loserId;
    }
}

/**
 * DTO для NextStage
 * @param gameId id игры
 */
export class NextStageDto {
    gameId: string;

    constructor(data: GameNextStageParams) {
        this.gameId = data.gameId;
    }
}

/**
 * DTO для LikeAnswer
 * @param lobbyCode код лобби
 * @param senderId телеграм id игрока, который лайкнул ответ
 * @param receiverId телеграм id игрока, чей ответ был лайкнут
 */
export class LikeAnswerDto {
    gameId: string;
    senderId: string;
    receiverId: string;

    constructor(data: GameLikeAnswerParams) {
        this.gameId = data.gameId;
        this.senderId = data.senderId;
        this.receiverId = data.receiverId;
    }
}

/**
 * DTO для SetAnswer
 * @param gameId id игры
 * @param playerId телеграм id игрока
 * @param answer ответ игрока
 */
export class SetAnswerDto {
    gameId: string;
    playerId: string;
    answer: number;

    constructor(data: GameSetAnswerParams) {
        this.gameId = data.gameId;
        this.playerId = data.playerId;
        this.answer = data.answer;
    }
}

/**
 * DTO для ConfirmAnswer
 * @param gameId id игры
 * @param playerId телеграм id игрока
 */
export class ConfirmAnswerDto {
    gameId: string;
    playerId: string;

    constructor(data: GameConfirmAnswerParams) {
        this.gameId = data.gameId;
        this.playerId = data.playerId;
    }
}

/**
 * DTO выбора лжеца
 */
export class LiarChoosesDto {
  public readonly gameId: string;
  public readonly answer: boolean;

  constructor(param: GameLiarChoosesParams) {
    this.gameId = param.gameId;
    this.answer = param.answer;
  }
}
