import type { Server, Socket } from "socket.io";
import type { ServerToClientEventMap } from "../../../common/message-types";

type ServerEventName = keyof ServerToClientEventMap;

/**
 * Типизированная отправка события конкретному сокету.
 */
export function emitToSocket<E extends ServerEventName>(
  socket: Socket,
  event: E,
  payload: ServerToClientEventMap[E],
) {
  socket.emit(event as string, payload);
}

/**
 * Типизированная отправка события всем сокетам комнаты.
 */
export function emitToRoom<E extends ServerEventName>(
  io: Server,
  room: string,
  event: E,
  payload: ServerToClientEventMap[E],
) {
  io.to(room).emit(event as string, payload);
}

/**
 * Типизированная отправка события всем сокетам комнаты, кроме текущего.
 */
export function emitToRoomFromSocket<E extends ServerEventName>(
  socket: Socket,
  room: string,
  event: E,
  payload: ServerToClientEventMap[E],
) {
  socket.to(room).emit(event as string, payload);
}
