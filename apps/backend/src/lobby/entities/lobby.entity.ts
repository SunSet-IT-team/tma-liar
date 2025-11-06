import type { Question } from '../../decks/entities/question.entity';
import type { Player } from './player.entity';
import type { Settings } from './settings.entity';

/**
 * Сущность "Лобби"
 */
export interface Lobby {
  id: number;
  status: 'waiting' | 'game' | 'end';
  players: Player[];
  lobbyCode: string;
  admin: number | null;
  settings: Settings;
  questionHistory: Question[];
  activeQuestion: Question;
  currentScreen:
    | 'lobby'
    | 'question'
    | 'answer'
    | 'liar_results'
    | 'waiting'
    | 'results'
    | 'score'
    | 'end';
}
