import type { Socket } from 'socket.io-client';
import type {
  ClientToServerAckMap,
  ClientToServerEventMap,
  ServerToClientEventMap,
} from '@common/message-types';
import { PROTOCOL_VERSION } from '@common/message-types';

function withProtocolVersion<T>(payload: T): T {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return {
      ...(payload as Record<string, unknown>),
      protocolVersion: PROTOCOL_VERSION,
    } as T;
  }
  return payload;
}

/**
 * Типизированная отправка socket-события без ack.
 */
export function emitEvent<E extends keyof ClientToServerEventMap>(
  socket: Socket,
  event: E,
  payload: ClientToServerEventMap[E],
) {
  socket.emit(event as string, withProtocolVersion(payload));
}

/**
 * Типизированная отправка socket-события с ack.
 */
export function emitEventWithAck<
  E extends keyof ClientToServerAckMap & keyof ClientToServerEventMap,
>(
  socket: Socket,
  event: E,
  payload: ClientToServerEventMap[E],
  ack: (payload: Partial<ClientToServerAckMap[E]>) => void,
) {
  socket.emit(event as string, withProtocolVersion(payload), ack);
}

/**
 * Типизированная подписка на входящее socket-событие.
 */
export function onEvent<E extends keyof ServerToClientEventMap>(
  socket: Socket,
  event: E,
  handler: (payload: ServerToClientEventMap[E]) => void,
) {
  socket.on(event as string, handler as (...args: unknown[]) => void);
}

/**
 * Типизированная одноразовая подписка на входящее socket-событие.
 */
export function onceEvent<E extends keyof ServerToClientEventMap>(
  socket: Socket,
  event: E,
  handler: (payload: ServerToClientEventMap[E]) => void,
) {
  socket.once(event as string, handler as (...args: unknown[]) => void);
}

/**
 * Типизированная отписка от входящего socket-события.
 */
export function offEvent<E extends keyof ServerToClientEventMap>(
  socket: Socket,
  event: E,
  handler: (payload: ServerToClientEventMap[E]) => void,
) {
  socket.off(event as string, handler as (...args: unknown[]) => void);
}
