export type LobbyPlayerPayload = {
  id: string;
  telegramId: string;
  nickname: string;
  profileImg?: string;
  score: number;
  isReady: boolean;
  inGame?: boolean;
  loserTask: string;
  wasLiar: number;
  answer: number | null;
  likes: number;
  isConfirmed: boolean;
};

export type LobbyPlayerView = {
  id: string;
  nickname: string;
  profileImg?: string;
  isReady?: boolean;
  inGame?: boolean;
  loserTask?: string | null;
};

export type LobbyQuestion = {
  id: string;
  type: string;
  content: string;
  complexity: number;
};

export type LobbyDeck = {
  name: string;
  questionsCount: number;
  cover: string;
  questions: LobbyQuestion[];
};

export type LobbySettings = {
  deck: LobbyDeck;
  deckId: string;
  questionCount: number;
  answerTime: number;
};

export type LobbyState = {
  lobbyCode: string;
  adminId: string;
  currentGameId: string | null;
  status: string;
  players: LobbyPlayerPayload[];
  settings: LobbySettings;
};

export type LobbyStateView = {
  lobbyCode: string;
  adminId: string;
  currentGameId?: string | null;
  status: string;
  players: LobbyPlayerView[];
};

export type ApiEnvelope<T> = {
  status: 'success' | 'error';
  payload: T;
};
