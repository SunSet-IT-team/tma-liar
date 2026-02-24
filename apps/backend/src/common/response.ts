import type { GameMessageTypes } from "../../../common/message-types/game.types";
import type { LobbyMessageTypes } from "../../../common/message-types/lobby.types";

/**
 * Типизация ответов АПИ
 */
enum ApiResponseStatus {
    SUCCESS = "success",
    ERROR = "error",
}

export interface ApiResponse<T> { 
    status: ApiResponseStatus, 
    code?: number, 
    message?: string, 
    payload: T | null,
}


export function success<T>(payload: T): ApiResponse<T> { 
    return {
        status: ApiResponseStatus.SUCCESS, 
        payload: payload,
    };
}

/**
 * Функция для построения объекта с состоянием и разницей
 * @param messageType Тип сообщения
 * @param diff Разница между текущим и новым состоянием
 * @returns Объект с состоянием и разницей
 */
export function buildStatePayload<T>(
    messageType: GameMessageTypes | LobbyMessageTypes,
    diff: T
  ) {
    return {
      status: messageType,
      diff,
    };
  }

export function error(code: number, message?: string): ApiResponse<null> {
  return {
    status: ApiResponseStatus.ERROR,
    code,
    message: message,
    payload: null,
  };
}

export class ApiError extends Error { 
    constructor(public code: number, message?: string) {
        super(message); 
    }
}