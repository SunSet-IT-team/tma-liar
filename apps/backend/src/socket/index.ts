import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from '../middlewares/socketAuth.middleware';
import { registerLobbyHandler } from "./lobby.socket";
import { registerGameHandler } from "./game.socket";
import { logger } from '../observability/logger';

/**
 * Точка входа Socket.IO: auth, регистрация обработчиков по доменам (lobby / game).
 * События лобби и логика выхода при disconnect — в `lobby.socket.ts`; игровые — в `game.socket.ts`.
 */
export function registerSocketHandlers(io: Server) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id, userId: socket.data.userId }, 'Socket connected');

    registerLobbyHandler(io, socket);
    registerGameHandler(io, socket);  

    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, userId: socket.data.userId, reason }, 'Socket.IO disconnect (global)');
    });
  });
}
