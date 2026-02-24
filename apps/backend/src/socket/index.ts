import { Server, Socket } from "socket.io";
import { registerLobbyHandler } from "./lobby.socket";
import { registerGameHandler } from "./game.socket";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    registerLobbyHandler(io, socket);
    registerGameHandler(io, socket);  

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}