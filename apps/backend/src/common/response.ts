/**
 * Типизация ответов АПИ
 */
export interface ApiResponse<T> { 
    status: "success" | "error", 
    code?: number, 
    message?: string, 
    payload: T | null,
}

export function success<T>(payload: T): ApiResponse<T> { 
    return {
        status: "success", 
        payload: payload,
    };
}

export function error(code: number, message?: string): ApiResponse<null> {
  return {
    status: "error",
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