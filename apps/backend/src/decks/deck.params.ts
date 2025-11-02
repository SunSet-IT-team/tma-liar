export interface DeckApiFindDeckParams {
  id?: number;
}

export interface DeckApiFindDecksParams {
  ids?: number[];
  names?: string[];
}

export interface DeckApiCreateDeckParams {
  name: string;
  questionsCount: number;
  cover: string;
  questions: number;
}

export interface DeckApiUpdateDeckParams {
  id: number;
  name?: string;
  questionsCount?: number;
  cover?: string;
  questions?: number;
}

export interface DeckApiDeleteDeckParams {
  id: number;
}
