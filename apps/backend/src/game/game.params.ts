import type { GameStages } from "../lobby/entities/lobby.entity";
import type { Player } from "../lobby/entities/player.entity";
import type { Settings } from "../lobby/entities/settings.entity";

/**
 * Интерфейсы для работы с игрой
 */

/**
 * Интерфейс для поиска игры
 * @param gameId id игры
 */
export interface GameFindParams {
  gameId: string;
}

/**
 * Интерфейс для метода смены стадии игры
 * @param gameId код игры
 */
export interface GameNextStageParams { 
  gameId: string;
}

/**
 * Интерфейс для метода лайка ответа игрока
 * @param senderId id игрока, который лайкнул ответ
 * @param receiverId id игрока, чей ответ был лайкнут
 * @param gameId id игры
 */
export interface GameLikeAnswerParams { 
  senderId: string;
  receiverId: string;
  gameId: string;
}

/**
 * Интерфейс для метода установки ответа игрока
 * @param lobbyCode код лобби
 * @param playerId телеграм id игрока
 * @param answer ответ игрока ()
 */
export interface GameSetAnswerParams { 
  gameId: string;
  playerId: string; 
  answer: number;
}

/**
 * Интерфейс для метода инициализации игры
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
export interface GameStartParams {
  lobbyId: string;
  stage: GameStages,
  players: Player[];
  settings: Settings; 
  liarId: string | null;
  questionHistory: string[];
  activeQuestion: string | null;
  timerId: NodeJS.Timeout | null;
  doLie: boolean | null;
  loserTask: string | null;
  winnerId: string | null;
  loserId: string | null;
}

/**
 * Интерфейс метода выбора лжеца 
 * @param gameId id игры
 * @param answer ответ
 */
export interface GameLiarChoosesParams {
  gameId: string;
  answer: boolean;
}

/**
 * Интерфейс для фиксации ответа игрока
 * @param gameId id игры 
 * @param playerId tg id игрока
 */
export interface GameConfirmAnswerParams {
  gameId: string;
  playerId: string;
}
