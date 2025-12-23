export interface DeckApiFindDeckParams {
  id?: string;
}

export interface DeckApiFindDecksParams {
  ids?: string[];
  names?: string[];
}

export interface DeckApiCreateDeckParams {
  name: string;
  questionsCount: number;
  cover: string;
  questions: number;
}

export interface DeckApiUpdateDeckParams {
  id: string;
  name?: string;
  questionsCount?: number;
  cover?: string;
  questions?: number;
}

export interface DeckApiDeleteDeckParams {
  id: string;
}
