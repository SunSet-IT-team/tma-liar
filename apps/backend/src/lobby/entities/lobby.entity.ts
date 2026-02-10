import type { Player } from './player.entity';

/**
 * Сущность "Лобби"
 */

/**
 * Статусы лобби
 * @property WAITING - Лобби ожидает игроков
 * @property STARTED - Игра в лобби началась
 * @property FINISHED - Игра в лобби закончена
 */
export enum LobbyStatus {
  WAITING = 'waiting',
  STARTED = 'started',
  FINISHED = 'finished',
}

/**
 * Экраны лобби
 * @property LOBBY - Экран ожидания игроков в лобби
 * @property GAME - Экран самой игры
 * @property RESULT - Экран результатов игры
 */
export enum LobbyScreen {
  LOBBY = 'lobby',
  GAME = 'game',
  RESULT = 'result',
}

/**
 * Этапы игры

 * @property LOBBY - Этап лобби перед началом игры
 * @property LIAR_CHOOSES - Этап, когда "лжец" выбирает кого-то
 * @property QUESTION_TO_LIAR - Этап, когда задают вопрос лжецу
 * @property QUESTION_RESULTS - Этап отображения результатов вопроса
 * @property GAME_RESULTS - Этап отображения результатов всей игры
 * @property END - Конечный этап игры
 */
export enum GameStages { 
  LOBBY = 'lobby', 
  LIAR_CHOOSES = 'liar_chooses', 
  QUESTION_TO_LIAR = 'question_to_liar', 
  QUESTION_RESULTS = 'question_results', 
  GAME_RESULTS = 'game_results', 
  END = 'end',
}


/**Интерфейс для лобби */
export interface Lobby {
  lobbyCode: string;
  adminId: string;
  currentGameId: string | null;
  status: LobbyStatus;
  players: Player[] | [];
}
