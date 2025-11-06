export interface UserApiFindUserParams {
  id: number;
}

export interface UserApiFindUsersParams {
  ids: number[];
}

export interface UserApiCreateUserParams {
  nickname: string;
  profileImg: string;
}

export interface UserApiUpdateUserParams {
  id: number;
  nickname?: string;
  profileImg?: string;
}

export interface UserApiDeleteUserParams {
  id: number;
}
