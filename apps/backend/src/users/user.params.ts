export interface UserApiFindUserParams {
  telegramId: string;
}

export interface UserApiFindUsersParams {
  telegramIds: string[];
}
  
export interface UserApiCreateUserParams {
  telegramId: string;
  nickname: string;
  profileImg?: string;
  passwordHash?: string;
}

export interface UserApiUpdateUserParams {
  telegramId: string;
  nickname?: string;
  profileImg?: string;
  passwordHash?: string;
}

export interface UserApiDeleteUserParams {
  telegramId: string;
}