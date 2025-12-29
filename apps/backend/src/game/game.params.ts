export interface GameNextStageParams { 
  lobbyCode: string;
}

export interface GameLikeAnswerParams { 
  senderId: string;
  receiverId: string;
  lobbyCode: string;
}

export interface GameSetAnswerParams { 
  lobbyCode: string;
  telegramId: string; 
  answer: number;
}

export interface GamePlayerAnswer { 
  answer: boolean;
}
