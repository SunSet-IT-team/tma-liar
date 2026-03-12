import type { GameMessageType } from "../../../common/message-types";
import type { LobbyMessageType } from "../../../common/message-types";

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
    errorCode?: string,
    message?: string, 
    details?: unknown,
    payload: T | null,
}

/**
 * Формирует успешный ответ API в едином формате.
 */
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
    messageType: GameMessageType | LobbyMessageType,
    diff: T
  ) {
    return {
      status: messageType,
      diff,
    };
  }

export function error(
  code: number,
  errorCode: string,
  message?: string,
  details?: unknown,
): ApiResponse<null> {
  return {
    status: ApiResponseStatus.ERROR,
    code,
    errorCode,
    message: message ?? errorCode,
    details,
    payload: null,
  };
}

/**
 * Бизнес-ошибка приложения.
 * Пробрасывается из сервисов/контроллеров и преобразуется в HTTP/socket ответ.
 */
export class ApiError extends Error { 
    public code: number;
    public errorCode: string;
    public details?: unknown;

    constructor(code: number, errorCode: string, details?: unknown, message?: string) {
        super(message ?? errorCode);
        this.code = code;
        this.errorCode = errorCode;
        this.details = details;
    }
}
