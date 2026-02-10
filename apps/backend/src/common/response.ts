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