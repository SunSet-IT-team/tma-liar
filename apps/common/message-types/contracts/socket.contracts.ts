/**
 * Универсальный payload ошибки для socket-событий.
 * Передается через `SocketSystemEvents.ERROR`.
 */
export type SocketErrorPayload = {
  /** Стабильный машинный код ошибки (используется для ветвления логики на клиенте). */
  errorCode?: string;
  /** Человекочитаемое сообщение об ошибке. */
  message?: string;
  /** Дополнительные диагностические данные (валидация, stack и т.п.). */
  details?: unknown;
};

/**
 * Стандартный формат ack-ответа для событий с callback-подтверждением.
 */
export type SocketAckPayload = {
  /** Признак успешной обработки действия на сервере. */
  ok: boolean;
  /** Код ошибки, если `ok === false`. */
  errorCode?: string;
  /** Текстовое пояснение ошибки, если `ok === false`. */
  message?: string;
};

/**
 * Сигнатура callback-функции для ack-ответа socket-события.
 */
export type SocketAck = (payload: SocketAckPayload) => void;
