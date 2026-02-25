import { LobbyModel } from "../lobby/lobby.model";
import { LobbyMessageTypes } from "../../../common/message-types/lobby.types";
import { LobbyService } from "../lobby/lobby.service";
import type { Server, Socket } from "socket.io";
import { JoinLobbyDtoSchema, type JoinLobbyDto } from "../lobby/dtos/lobby-join.dto";
import { ToggleReadyDtoSchema, type ToggleReadyDto } from "../lobby/dtos/lobby-toggleReady.dto";
import { LobbyStateDtoSchema } from "../lobby/dtos/lobby-state.dto";
import { PlayerInfoSchema } from "../game/dtos/game-init.dto";
import { findDiff } from "../common/diff";
import { ApiError, buildStatePayload } from "../common/response";
import { GameMessageTypes } from "../../../common/message-types/game.types";
import { GameStartDtoSchema } from "../game/dtos/game-start.dto";
import type { GameStartDto } from "../game/dtos/game-start.dto";
import { GameService } from "../game/game.service";
import { LobbyStatus } from "../lobby/entities/lobby.entity";

/**
 * Единая отправка socket-ошибок в формате, согласованном с HTTP-ошибками.
 */
function emitSocketError(socket: Socket, fallbackErrorCode: string, error: unknown) {
  if (error instanceof ApiError) {
    socket.emit("error", {
      errorCode: error.errorCode,
      message: error.message,
      details: error.details,
    });
    return;
  }

  socket.emit("error", {
    errorCode: fallbackErrorCode,
    message: fallbackErrorCode,
    details: error instanceof Error ? error.message : undefined,
  });
}

/**
 * Регистрирует обработчики lobby socket-событий.
 */
export function registerLobbyHandler(io: Server, socket: Socket) {
  const lobbyService = new LobbyService();
  const gameService = new GameService(io);

  socket.on(LobbyMessageTypes.PLAYER_JOINED, async (data: unknown) => {
    try {
      const result = JoinLobbyDtoSchema.safeParse(data);

      if (!result.success) {
        const formattedErrors = result.error.issues.map(issue => ({
          path: issue.path.join("."),
          message: issue.message
        }));
        console.error("Validation failed for PLAYER_JOINED:");
        console.table(formattedErrors);
        throw new ApiError(422, "JOIN_LOBBY_DATA_INVALID", result.error.issues);
      }

      const dto: JoinLobbyDto = result.data; 
      const lobbySnap = await lobbyService.findLobby({ lobbyCode: dto.lobbyCode });
      const lobby = await lobbyService.joinLobby(dto);

      const lobbyState = LobbyStateDtoSchema.parse({
        lobbyCode: lobby.lobbyCode,
        adminId: lobby.adminId,
        currentGameId: lobby.currentGameId,
        status: lobby.status,
        players: lobby.players.map(player => 
          PlayerInfoSchema.parse({
            id: player.id,
            nickname: player.nickname,
            profileImg: player.profileImg, 
          })
        ), 
      });

      // Подключаем сокет к комнате лобби
      socket.join(dto.lobbyCode);

      const roomSize = io.sockets.adapter.rooms.get(dto.lobbyCode)?.size ?? 0;
      console.log(`[PLAYER_JOINED] ${dto.player.nickname} → room ${dto.lobbyCode} (${roomSize} sockets in room)`);

      socket.emit(LobbyMessageTypes.PLAYER_JOINED, lobbyState); 
      socket.to(dto.lobbyCode).emit("changeGameStatus", buildStatePayload(LobbyMessageTypes.PLAYER_JOINED, findDiff(lobbySnap, lobby)));
    } catch (error) {
      console.error(`Error handling player join:`, error);
      emitSocketError(socket, "PLAYER_JOINED_ERROR", error);
    }
  });

  /**
   * Игрок выходит из лобби
   */
  socket.on(LobbyMessageTypes.PLAYER_LEFT, async ({ lobbyCode, telegramId }: { lobbyCode: string; telegramId: string }) => {
    try {
      const lobbySnap = await lobbyService.findLobby({ lobbyCode });
      const isAdmin = lobbySnap.adminId === telegramId;
      
      const updatedLobby = await LobbyModel.findOneAndUpdate(
        { lobbyCode },
        { $pull: { players: { telegramId } } },
        { new: true }
      ).lean();

      if (!updatedLobby) {
        console.error(`[PLAYER_LEFT] Lobby ${lobbyCode} not found`);
        return;
      }

      const remainingPlayers = updatedLobby.players || [];
      const shouldDeleteLobby = remainingPlayers.length === 0;

      if (shouldDeleteLobby) {
        await lobbyService.deleteLobby({ lobbyCode });
        io.to(lobbyCode).emit(LobbyMessageTypes.LOBBY_DELETED, { lobbyCode });
        console.log(`[PLAYER_LEFT] Lobby ${lobbyCode} deleted — no players left`);
      } else if (isAdmin && remainingPlayers.length > 0) {
        const firstPlayer = remainingPlayers[0];
        if (!firstPlayer) {
          console.error(`[PLAYER_LEFT] No players in lobby ${lobbyCode} after admin left`);
          return;
        }
        const newAdminId = firstPlayer.telegramId;
        await LobbyModel.updateOne(
          { lobbyCode },
          { $set: { adminId: newAdminId } }
        );        
        console.log(`[PLAYER_LEFT] Admin ${telegramId} left ${lobbyCode}, new admin: ${newAdminId}`);
      } else {
        console.log(`[PLAYER_LEFT] ${telegramId} left ${lobbyCode}`);
      }

      io.to(lobbyCode).emit("changeGameStatus", buildStatePayload(LobbyMessageTypes.PLAYER_LEFT, findDiff(lobbySnap, updatedLobby)));
      socket.leave(lobbyCode);
    } catch (error) {
      console.error(`[PLAYER_LEFT] Error:`, error);
      socket.leave(lobbyCode);
    }
  });

  /**
   * Игрок переключает готовность
   */
  socket.on(LobbyMessageTypes.PLAYER_READY, async (data: unknown) => {
    try {
      const result = ToggleReadyDtoSchema.safeParse(data);

      if (!result.success) {
        console.error("Validation failed for PLAYER_READY:", result.error.issues);
        throw new ApiError(422, "TOGGLE_READY_DATA_INVALID", result.error.issues);
      }

      const dto: ToggleReadyDto = result.data;
      const lobbySnap = await lobbyService.findLobby({ lobbyCode: dto.lobbyCode });
      const lobby = await lobbyService.togglePlayerReady(dto);

      const roomSize = io.sockets.adapter.rooms.get(dto.lobbyCode)?.size ?? 0;
      console.log(`[PLAYER_READY] player ${dto.playerId} → emitting to ${roomSize} sockets in room ${dto.lobbyCode}`);

      io.to(dto.lobbyCode).emit("changeGameStatus", buildStatePayload(LobbyMessageTypes.PLAYER_READY, findDiff(lobbySnap, lobby)));
    } catch (error) {
      console.error(`Error handling player ready:`, error);
      emitSocketError(socket, "PLAYER_READY_ERROR", error);
    }
  });

  socket.on(GameMessageTypes.GAME_STARTED, async (data: unknown) => {
    try {
      const dtoResult = GameStartDtoSchema.safeParse(data);

      if (!dtoResult.success) {
        dtoResult.error.issues.forEach((issue) => {
          console.log(`[GAME_STARTED] Validation: ${issue.path.join(".")} — ${issue.message}`);
        });
        throw new ApiError(422, "GAME_START_DATA_INVALID", dtoResult.error.issues);
      }

      const dto: GameStartDto = dtoResult.data;
      const lobbySnap = await lobbyService.findLobby({ lobbyCode: dto.lobbyCode });

      const createdGame = await gameService.createGame({...dto});
      const gameId = createdGame.id;

      // Обновляем статус лобби на STARTED и устанавливаем currentGameId
      await lobbyService.updateLobby({
        lobbyCode: dto.lobbyCode,
        status: LobbyStatus.STARTED,
        currentGameId: gameId,
      });

      // Присоединяем всех игроков к игровой комнате
      const lobbySockets = io.sockets.adapter.rooms.get(dto.lobbyCode);
      const lobbySocketCount = lobbySockets?.size ?? 0;

      if (lobbySockets) {
        for (const socketId of lobbySockets) {
          const s = io.sockets.sockets.get(socketId);
          if (!s) continue;
          s.join(gameId);
        }
      }

      const gameRoomSize = io.sockets.adapter.rooms.get(gameId)?.size ?? 0;
      console.log(`[GAME_STARTED] lobby ${dto.lobbyCode} (${lobbySocketCount} sockets) → game ${gameId} (${gameRoomSize} sockets), status: ${LobbyStatus.STARTED}`);

      const gameStateDto = {
        gameId: createdGame.id,
        stage: createdGame.stage,
        players: createdGame.players,
      };

      io.to(gameId).emit("changeGameStatus", gameStateDto);
      console.log(`[GAME_STARTED] changeGameStatus emitted to ${gameRoomSize} sockets`);

      // Запускаем игру — переходим на следующую стадию (LOBBY → LIAR_CHOOSES)
      // Это вызовет автоматическую смену стадий через таймеры
      await gameService.nextStage({ gameId });
      console.log(`[GAME_STARTED] Game stage transition initiated for ${gameId}`);
    } catch (error) {
      console.error("[GAME_STARTED] Error:", error);
      emitSocketError(socket, "GAME_START_ERROR", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[DISCONNECT] ${socket.id}`);
  });
}
