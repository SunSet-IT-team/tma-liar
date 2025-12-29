import type { Question } from '../../decks/entities/question.entity';
import type { Player } from './player.entity';
import type { Settings } from './settings.entity';

/**
 * Сущность "Лобби"
 */

export enum GameStages { 
  LOBBY = 'lobby' , 
  LIAR_CHOOSES ='liar_chooses' , 
  QUESTION_TO_LIAR = 'question_to_liar' , 
  QUESTION_RESULTS = 'question_results' , 
  GAME_RESULTS = 'game_results' , 
  END = 'end' 
}

export interface Lobby {
  status: 'waiting' | 'game' | 'end';
  players: Player[] | [];
  lobbyCode: string;
  adminId: string;
  settings: Settings;
  liarId: string | null;
  questionHistory: string[];
  activeQuestion?: Question;
  stage: GameStages,
  timerId: NodeJS.Timeout | null;
  doLie: boolean | null;
  loserTask: string | null;
  winnerId: string | null;
  loserId: string | null;
}
