import type { Question } from '../../decks/entities/question.entity';
import type { Player } from './player.entity';
import type { Settings } from './settings.entity';

/**
 * Сущность "Лобби"
 */
export interface Lobby {
  status: 'waiting' | 'game' | 'end';
  players: Player[] | [];
  lobbyCode: string;
  adminId: string;
  settings: Settings;
  questionHistory: Question[];
  activeQuestion?: Question;
  stage:
    | 'lobby'
    | 'liar_chooses'
    | 'question_to_liar'
    | 'liar_results'
    | 'game_results'
    | 'end';
}
