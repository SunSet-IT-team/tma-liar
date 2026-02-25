import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from '../middlewares/socketAuth.middleware';
import { registerLobbyHandler } from "./lobby.socket";
import { registerGameHandler } from "./game.socket";

export function registerSocketHandlers(io: Server) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    registerLobbyHandler(io, socket);
    registerGameHandler(io, socket);  

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
