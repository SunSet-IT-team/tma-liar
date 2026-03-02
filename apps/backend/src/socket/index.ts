import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from '../middlewares/socketAuth.middleware';
import { registerLobbyHandler } from "./lobby.socket";
import { registerGameHandler } from "./game.socket";
import { logger } from '../observability/logger';

export function registerSocketHandlers(io: Server) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id, userId: socket.data.userId }, 'Socket connected');

    registerLobbyHandler(io, socket);
    registerGameHandler(io, socket);  

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id, userId: socket.data.userId }, 'Socket disconnected');
    });
  });
}
