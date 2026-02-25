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
import { logger } from "../observability/logger";

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
        const formattedErrors = result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));
        logger.warn({ issues: formattedErrors }, 'Validation failed for PLAYER_JOINED');
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
      logger.info(
        { nickname: dto.player.nickname, lobbyCode: dto.lobbyCode, roomSize },
        'Player joined lobby room',
      );

      socket.emit(LobbyMessageTypes.PLAYER_JOINED, lobbyState); 
      socket.to(dto.lobbyCode).emit("changeGameStatus", buildStatePayload(LobbyMessageTypes.PLAYER_JOINED, findDiff(lobbySnap, lobby)));
    } catch (error) {
      logger.error({ error }, 'Error handling player join');
      emitSocketError(socket, "PLAYER_JOINED_ERROR", error);
    }
  });

  /**
   * Игрок выходит из лобби
   */
  socket.on(LobbyMessageTypes.PLAYER_LEFT, async ({ lobbyCode, telegramId }: { lobbyCode: string; telegramId: string }) => {
    try {
      const lobbySnap = await lobbyService.findLobby({ lobbyCode });
      const leaveResult = await lobbyService.leaveLobby({ lobbyCode, telegramId });

      if (leaveResult.deleted) {
        io.to(lobbyCode).emit(LobbyMessageTypes.LOBBY_DELETED, { lobbyCode });
        logger.info({ lobbyCode }, 'Lobby deleted after player left');
      } else if (leaveResult.newAdminId) {
        logger.info({ lobbyCode, previousAdmin: telegramId, newAdmin: leaveResult.newAdminId }, 'Admin transferred');
      } else {
        logger.info({ lobbyCode, telegramId }, 'Player left lobby');
      }

      if (leaveResult.lobby) {
        io.to(lobbyCode).emit("changeGameStatus", buildStatePayload(LobbyMessageTypes.PLAYER_LEFT, findDiff(lobbySnap, leaveResult.lobby)));
      }
      socket.leave(lobbyCode);
    } catch (error) {
      logger.error({ error, lobbyCode, telegramId }, 'Error handling player left');
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
        logger.warn({ issues: result.error.issues }, 'Validation failed for PLAYER_READY');
        throw new ApiError(422, "TOGGLE_READY_DATA_INVALID", result.error.issues);
      }

      const dto: ToggleReadyDto = result.data;
      const lobbySnap = await lobbyService.findLobby({ lobbyCode: dto.lobbyCode });
      const lobby = await lobbyService.togglePlayerReady(dto);

      const roomSize = io.sockets.adapter.rooms.get(dto.lobbyCode)?.size ?? 0;
      logger.info({ playerId: dto.playerId, roomSize, lobbyCode: dto.lobbyCode }, 'Player ready toggled');

      io.to(dto.lobbyCode).emit("changeGameStatus", buildStatePayload(LobbyMessageTypes.PLAYER_READY, findDiff(lobbySnap, lobby)));
    } catch (error) {
      logger.error({ error }, 'Error handling player ready');
      emitSocketError(socket, "PLAYER_READY_ERROR", error);
    }
  });

  socket.on(GameMessageTypes.GAME_STARTED, async (data: unknown) => {
    try {
      const dtoResult = GameStartDtoSchema.safeParse(data);

      if (!dtoResult.success) {
        logger.warn({ issues: dtoResult.error.issues }, 'Validation failed for GAME_STARTED');
        throw new ApiError(422, "GAME_START_DATA_INVALID", dtoResult.error.issues);
      }

      const dto: GameStartDto = dtoResult.data;
      const createdGame = await gameService.createGame({...dto});
      const gameId = createdGame.id;

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
      logger.info(
        { lobbyCode: dto.lobbyCode, lobbySocketCount, gameId, gameRoomSize, status: 'started' },
        'Game room initialized',
      );

      const gameStateDto = {
        gameId: createdGame.id,
        stage: createdGame.stage,
        players: createdGame.players,
      };

      io.to(gameId).emit("changeGameStatus", gameStateDto);
      logger.info({ gameId, gameRoomSize }, 'Game start status emitted');

      // Запускаем игру — переходим на следующую стадию (LOBBY → LIAR_CHOOSES)
      // Это вызовет автоматическую смену стадий через таймеры
      await gameService.nextStage({ gameId });
      logger.info({ gameId }, 'Game stage transition initiated');
    } catch (error) {
      logger.error({ error }, 'Error handling game started');
      emitSocketError(socket, "GAME_START_ERROR", error);
    }
  });

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, 'Socket disconnected (lobby handler)');
  });
}
