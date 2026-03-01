import { LobbyMessageTypes } from "../../../common/message-types/enums/lobby.types";
import { SocketSystemEvents } from "../../../common/message-types/events/socket.events";
import type { SocketAck, SocketErrorPayload } from "../../../common/message-types/contracts/socket.contracts";
import { LobbyService } from "../lobby/lobby.service";
import type { Server, Socket } from "socket.io";
import type { JoinLobbyDto } from "../lobby/dtos/lobby-join.dto";
import type { ToggleReadyDto } from "../lobby/dtos/lobby-toggleReady.dto";
import { LobbyStateDtoSchema } from "../lobby/dtos/lobby-state.dto";
import { PlayerInfoSchema } from "../game/dtos/game-init.dto";
import { findDiff } from "../common/diff";
import { ApiError, buildStatePayload } from "../common/response";
import { GameMessageTypes } from "../../../common/message-types/enums/game.types";
import { GameStartDtoSchema } from "../game/dtos/game-start.dto";
import type { GameStartDto } from "../game/dtos/game-start.dto";
import { GameService } from "../game/game.service";
import { logger } from "../observability/logger";
import z from 'zod';
import { UserRepository } from '../users/user.repository';
import { env } from '../config/env';
import { SettingsSchema } from '../lobby/entities/settings.entity';
import { GameStages, LobbyStatus } from '../lobby/entities/lobby.entity';

const LobbySubscribeDtoSchema = z.object({
  lobbyCode: z.string().min(1),
});

const JoinLobbySocketSchema = z.object({
  lobbyCode: z.string().min(1),
  nickname: z.string().min(1).optional(),
  profileImg: z.string().optional(),
  loserTask: z.string().optional(),
  player: z
    .object({
      nickname: z.string().min(1).optional(),
      profileImg: z.string().optional(),
      loserTask: z.string().optional(),
    })
    .optional(),
});

const LeaveLobbySocketSchema = z.object({
  lobbyCode: z.string().min(1),
});

const ToggleReadySocketSchema = z.object({
  lobbyCode: z.string().min(1),
  playerId: z.string().min(1).optional(),
  loserTask: z.string().nullable().optional(),
});

const StartGameSocketSchema = z.object({
  lobbyCode: z.string().min(1),
});

function buildLobbyState(lobby: {
  lobbyCode: string;
  adminId: string;
  currentGameId: string | null;
  status: string;
    players: Array<{
      id?: string;
      telegramId: string;
      nickname: string;
      profileImg?: string;
      isReady?: boolean;
      inGame?: boolean;
      loserTask?: string | null;
    }>;
}) {
  return LobbyStateDtoSchema.parse({
    lobbyCode: lobby.lobbyCode,
    adminId: lobby.adminId,
    currentGameId: lobby.currentGameId,
    status: lobby.status,
    players: lobby.players.map((player) =>
      PlayerInfoSchema.parse({
        id: player.telegramId,
        nickname: player.nickname,
        profileImg: player.profileImg ?? '',
        isReady: player.isReady ?? false,
        inGame: player.inGame ?? false,
        loserTask: player.loserTask ?? null,
      }),
    ),
  });
}

function buildLobbyDiffState(lobby: {
  lobbyCode: string;
  adminId: string;
  currentGameId: string | null;
  status: string;
    players: Array<{
      telegramId: string;
      nickname: string;
      profileImg?: string;
      isReady?: boolean;
      inGame?: boolean;
      loserTask?: string | null;
    }>;
}) {
  return {
    lobbyCode: lobby.lobbyCode,
    adminId: lobby.adminId,
    currentGameId: lobby.currentGameId,
    status: lobby.status,
    players: lobby.players.map((player) => ({
      id: player.telegramId,
      nickname: player.nickname,
      profileImg: player.profileImg ?? '',
      isReady: player.isReady ?? false,
      inGame: player.inGame ?? false,
      loserTask: player.loserTask ?? null,
    })),
  };
}

function normalizeLobbySettings(rawSettings: unknown) {
  const source = (rawSettings && typeof rawSettings === 'object'
    ? (rawSettings as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const questionCountCandidate =
    typeof source.questionCount === 'number'
      ? source.questionCount
      : typeof source.questionsCount === 'number'
        ? source.questionsCount
        : source.deck &&
            typeof source.deck === 'object' &&
            typeof (source.deck as Record<string, unknown>).questionsCount === 'number'
          ? ((source.deck as Record<string, unknown>).questionsCount as number)
          : undefined;

  return SettingsSchema.parse({
    ...source,
    questionCount: questionCountCandidate,
  });
}

/**
 * Единая отправка socket-ошибок в формате, согласованном с HTTP-ошибками.
 */
function emitSocketError(socket: Socket, fallbackErrorCode: string, error: unknown) {
  if (error instanceof ApiError) {
    const payload: SocketErrorPayload = {
      errorCode: error.errorCode,
      message: error.message,
      details: error.details,
    };
    socket.emit(SocketSystemEvents.ERROR, payload);
    return;
  }

  const payload: SocketErrorPayload = {
    errorCode: fallbackErrorCode,
    message: fallbackErrorCode,
    details: error instanceof Error ? error.message : undefined,
  };
  socket.emit(SocketSystemEvents.ERROR, payload);
}

/**
 * Регистрирует обработчики lobby socket-событий.
 */
export function registerLobbyHandler(io: Server, socket: Socket) {
  const lobbyService = new LobbyService();
  const gameService = new GameService(io);
  const userRepository = new UserRepository();

  socket.on(LobbyMessageTypes.LOBBY_SUBSCRIBE, async (data: unknown) => {
    try {
      const dtoResult = LobbySubscribeDtoSchema.safeParse(data);

      if (!dtoResult.success) {
        throw new ApiError(422, 'LOBBY_SUBSCRIBE_DATA_INVALID', dtoResult.error.issues);
      }

      const { lobbyCode } = dtoResult.data;
      const lobby = await lobbyService.findLobby({ lobbyCode });

      socket.join(lobbyCode);
      socket.emit(LobbyMessageTypes.LOBBY_STATE, buildLobbyState(lobby));

      const roomSize = io.sockets.adapter.rooms.get(lobbyCode)?.size ?? 0;
      logger.info({ lobbyCode, roomSize, socketId: socket.id }, 'Socket subscribed to lobby room');
    } catch (error) {
      logger.error({ error }, 'Error handling lobby subscribe');
      emitSocketError(socket, 'LOBBY_SUBSCRIBE_ERROR', error);
    }
  });

  socket.on(LobbyMessageTypes.PLAYER_JOINED, async (data: unknown) => {
    try {
      const result = JoinLobbySocketSchema.safeParse(data);

      if (!result.success) {
        const formattedErrors = result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));
        logger.warn({ issues: formattedErrors }, 'Validation failed for PLAYER_JOINED');
        throw new ApiError(422, "JOIN_LOBBY_DATA_INVALID", result.error.issues);
      }

      const socketUserId = socket.data.userId;

      if (typeof socketUserId !== 'string' || socketUserId.trim().length === 0) {
        throw new ApiError(401, 'UNAUTHORIZED');
      }

      const normalizedUserId = socketUserId.trim();
      const user = await userRepository.findByTelegramId(normalizedUserId);
      const requestedNickname = result.data.nickname ?? result.data.player?.nickname;
      const requestedProfileImg = result.data.profileImg ?? result.data.player?.profileImg;
      const requestedLoserTask = result.data.loserTask ?? result.data.player?.loserTask;

      const dto: JoinLobbyDto = {
        lobbyCode: result.data.lobbyCode,
        player: {
          id: normalizedUserId,
          telegramId: normalizedUserId,
          nickname:
            user?.nickname ??
            (typeof requestedNickname === 'string' && requestedNickname.trim().length > 0
              ? requestedNickname.trim()
              : `Guest_${normalizedUserId.slice(-4)}`),
          profileImg: user?.profileImg ?? requestedProfileImg ?? '',
          score: 0,
          isReady: false,
          inGame: false,
          loserTask: requestedLoserTask ?? '',
          wasLiar: 0,
          answer: null,
          likes: 0,
          isConfirmed: false,
        },
      };

      const lobbySnap = await lobbyService.findLobby({ lobbyCode: dto.lobbyCode });
      const lobby = await lobbyService.joinLobby(dto);
      const lobbyState = buildLobbyState(lobby);
      const snapForDiff = buildLobbyDiffState(lobbySnap);
      const nextForDiff = buildLobbyDiffState(lobby);

      // Подключаем сокет к комнате лобби
      socket.join(dto.lobbyCode);

      const roomSize = io.sockets.adapter.rooms.get(dto.lobbyCode)?.size ?? 0;
      logger.info(
        { nickname: dto.player.nickname, lobbyCode: dto.lobbyCode, roomSize },
        'Player joined lobby room',
      );

      socket.emit(LobbyMessageTypes.PLAYER_JOINED, lobbyState); 
      socket.to(dto.lobbyCode).emit(
        SocketSystemEvents.STATUS_CHANGED,
        buildStatePayload(LobbyMessageTypes.PLAYER_JOINED, findDiff(snapForDiff, nextForDiff)),
      );
    } catch (error) {
      logger.error({ error }, 'Error handling player join');
      emitSocketError(socket, "PLAYER_JOINED_ERROR", error);
    }
  });

  /**
   * Игрок выходит из лобби
   */
  socket.on(LobbyMessageTypes.PLAYER_LEFT, async (data: unknown, ack?: SocketAck) => {
    try {
      const result = LeaveLobbySocketSchema.safeParse(data);
      if (!result.success) {
        throw new ApiError(422, 'LEAVE_LOBBY_DATA_INVALID', result.error.issues);
      }

      const socketUserId = socket.data.userId;
      if (typeof socketUserId !== 'string' || socketUserId.trim().length === 0) {
        throw new ApiError(401, 'UNAUTHORIZED');
      }

      const telegramId = socketUserId.trim();
      const { lobbyCode } = result.data;
      const lobbySnap = await lobbyService.findLobby({ lobbyCode });
      const snapForDiff = buildLobbyDiffState(lobbySnap);
      let resetToWaitingAfterLeave = false;

      if (lobbySnap.status === LobbyStatus.STARTED && lobbySnap.currentGameId) {
        try {
          const game = await gameService.findGame(lobbySnap.currentGameId);
          const firstRoundNotFinished =
            game.questionHistory.length <= 1 &&
            (game.stage === GameStages.LIAR_CHOOSES ||
              game.stage === GameStages.QUESTION_TO_LIAR ||
              game.stage === GameStages.QUESTION_RESULTS);

          if (firstRoundNotFinished) {
            resetToWaitingAfterLeave = true;
            logger.info(
              { lobbyCode, gameId: lobbySnap.currentGameId, loserId: telegramId },
              'Player left before first round end, lobby will be reset to waiting',
            );
          } else {
            await gameService.finishGameBecausePlayerLeft({
              gameId: lobbySnap.currentGameId,
              loserId: telegramId,
            });
            logger.info(
              { lobbyCode, gameId: lobbySnap.currentGameId, loserId: telegramId },
              'Game finished because player left during active match',
            );
          }
        } catch (finishError) {
          logger.warn(
            { lobbyCode, gameId: lobbySnap.currentGameId, loserId: telegramId, error: finishError },
            'Failed to finish game on player leave, continuing leave flow',
          );
        }
      }

      const leaveResult = await lobbyService.leaveLobby({ lobbyCode, telegramId });
      const gameIdToDiscard = lobbySnap.currentGameId;

      if (resetToWaitingAfterLeave && gameIdToDiscard) {
        await gameService.discardGame({ gameId: gameIdToDiscard });
      }

      if (leaveResult.deleted) {
        io.to(lobbyCode).emit(LobbyMessageTypes.LOBBY_DELETED, { lobbyCode });
        logger.info({ lobbyCode }, 'Lobby deleted after player left');
      } else if (leaveResult.newAdminId) {
        logger.info({ lobbyCode, previousAdmin: telegramId, newAdmin: leaveResult.newAdminId }, 'Admin transferred');
      } else {
        logger.info({ lobbyCode, telegramId }, 'Player left lobby');
      }

      if (leaveResult.lobby && resetToWaitingAfterLeave) {
        const resetLobby = await lobbyService.updateLobby({
          lobbyCode,
          status: LobbyStatus.WAITING,
          currentGameId: null,
        });
        const nextForDiff = buildLobbyDiffState(resetLobby);
        io.to(lobbyCode).emit(
          SocketSystemEvents.STATUS_CHANGED,
          buildStatePayload(LobbyMessageTypes.PLAYER_LEFT, findDiff(snapForDiff, nextForDiff)),
        );
      } else if (leaveResult.lobby) {
        const nextForDiff = buildLobbyDiffState(leaveResult.lobby);
        io.to(lobbyCode).emit(
          SocketSystemEvents.STATUS_CHANGED,
          buildStatePayload(LobbyMessageTypes.PLAYER_LEFT, findDiff(snapForDiff, nextForDiff)),
        );
      }
      socket.leave(lobbyCode);
      ack?.({ ok: true });
    } catch (error) {
      logger.error({ error, socketUserId: socket.data.userId }, 'Error handling player left');
      emitSocketError(socket, 'PLAYER_LEFT_ERROR', error);

      if (error instanceof ApiError) {
        ack?.({
          ok: false,
          errorCode: error.errorCode,
          message: error.message,
        });
      } else {
        ack?.({
          ok: false,
          errorCode: 'PLAYER_LEFT_ERROR',
          message: 'PLAYER_LEFT_ERROR',
        });
      }
    }
  });

  /**
   * Игрок выходит только из активной игры, но остается в лобби.
   * Все участники возвращаются в статус ожидания.
   */
  socket.on(LobbyMessageTypes.PLAYER_EXIT_GAME, async (data: unknown, ack?: SocketAck) => {
    try {
      const result = LeaveLobbySocketSchema.safeParse(data);
      if (!result.success) {
        throw new ApiError(422, 'EXIT_GAME_DATA_INVALID', result.error.issues);
      }

      const socketUserId = socket.data.userId;
      if (typeof socketUserId !== 'string' || socketUserId.trim().length === 0) {
        throw new ApiError(401, 'UNAUTHORIZED');
      }

      const { lobbyCode } = result.data;
      const lobbySnap = await lobbyService.findLobby({ lobbyCode });
      const userId = socketUserId.trim();
      const playerExists = lobbySnap.players.some((player) => player.telegramId === userId);

      if (!playerExists) {
        throw new ApiError(404, 'PLAYER_NOT_IN_LOBBY');
      }

      if (lobbySnap.status !== LobbyStatus.STARTED || !lobbySnap.currentGameId) {
        ack?.({ ok: true });
        return;
      }

      const snapForDiff = buildLobbyDiffState(lobbySnap);
      await gameService.discardGame({ gameId: lobbySnap.currentGameId });

      const resetLobby = await lobbyService.updateLobby({
        lobbyCode,
        status: LobbyStatus.WAITING,
        currentGameId: null,
      });

      const nextForDiff = buildLobbyDiffState(resetLobby);
      io.to(lobbyCode).emit(
        SocketSystemEvents.STATUS_CHANGED,
        buildStatePayload(LobbyMessageTypes.PLAYER_EXIT_GAME, findDiff(snapForDiff, nextForDiff)),
      );

      logger.info(
        { lobbyCode, gameId: lobbySnap.currentGameId, requestedBy: userId },
        'Active game was exited to lobby',
      );
      ack?.({ ok: true });
    } catch (error) {
      logger.error({ error, socketUserId: socket.data.userId }, 'Error handling player exit game');
      emitSocketError(socket, 'EXIT_GAME_ERROR', error);

      if (error instanceof ApiError) {
        ack?.({
          ok: false,
          errorCode: error.errorCode,
          message: error.message,
        });
      } else {
        ack?.({
          ok: false,
          errorCode: 'EXIT_GAME_ERROR',
          message: 'EXIT_GAME_ERROR',
        });
      }
    }
  });

  /**
   * Игрок переключает готовность
   */
  socket.on(LobbyMessageTypes.PLAYER_READY, async (data: unknown) => {
    try {
      const result = ToggleReadySocketSchema.safeParse(data);

      if (!result.success) {
        logger.warn({ issues: result.error.issues }, 'Validation failed for PLAYER_READY');
        throw new ApiError(422, "TOGGLE_READY_DATA_INVALID", result.error.issues);
      }

      const socketUserId = socket.data.userId;
      if (typeof socketUserId !== 'string' || socketUserId.trim().length === 0) {
        throw new ApiError(401, 'UNAUTHORIZED');
      }

      const normalizedUserId = socketUserId.trim();
      const lobbySnap = await lobbyService.findLobby({ lobbyCode: result.data.lobbyCode });
      let currentPlayer = lobbySnap.players.find((player) => player.telegramId === normalizedUserId);

      if (!currentPlayer && result.data.playerId) {
        const byId = lobbySnap.players.find(
          (player) => player.id === result.data.playerId || player.telegramId === result.data.playerId,
        );
        if (byId) {
          // В production/normal auth не позволяем менять ready чужому игроку.
          if (!env.disableAuth && byId.telegramId !== normalizedUserId) {
            throw new ApiError(403, 'PLAYER_READY_FORBIDDEN');
          }
          currentPlayer = byId;
        }
      }

      if (!currentPlayer) {
        throw new ApiError(404, 'USER_NOT_FOUND_OR_LOBBY_EMPTY', {
          socketUserId: normalizedUserId,
          lobbyCode: result.data.lobbyCode,
          providedPlayerId: result.data.playerId ?? null,
        });
      }

      const dto: ToggleReadyDto = {
        lobbyCode: result.data.lobbyCode,
        // Service/repository toggle ready operates by stable telegramId key.
        playerId: currentPlayer.telegramId,
        loserTask: result.data.loserTask ?? null,
      };
      const lobby = await lobbyService.togglePlayerReady(dto);
      const snapForDiff = buildLobbyDiffState(lobbySnap);
      const nextForDiff = buildLobbyDiffState(lobby);

      const roomSize = io.sockets.adapter.rooms.get(dto.lobbyCode)?.size ?? 0;
      logger.info({ playerId: dto.playerId, roomSize, lobbyCode: dto.lobbyCode }, 'Player ready toggled');

      io.to(dto.lobbyCode).emit(
        SocketSystemEvents.STATUS_CHANGED,
        buildStatePayload(LobbyMessageTypes.PLAYER_READY, findDiff(snapForDiff, nextForDiff)),
      );
    } catch (error) {
      logger.error(
        {
          error,
          socketUserId: socket.data.userId,
          payload: data,
          details:
            error && typeof error === 'object' && 'details' in error
              ? (error as { details?: unknown }).details
              : undefined,
        },
        'Error handling player ready',
      );
      emitSocketError(socket, "PLAYER_READY_ERROR", error);
    }
  });

  socket.on(GameMessageTypes.GAME_STARTED, async (data: unknown) => {
    try {
      const dtoResult = StartGameSocketSchema.safeParse(data);

      if (!dtoResult.success) {
        logger.warn({ issues: dtoResult.error.issues }, 'Validation failed for GAME_STARTED');
        throw new ApiError(422, "GAME_START_DATA_INVALID", dtoResult.error.issues);
      }

      const socketUserId = socket.data.userId;
      if (typeof socketUserId !== 'string' || socketUserId.trim().length === 0) {
        throw new ApiError(401, 'UNAUTHORIZED');
      }

      const lobby = await lobbyService.findLobby({ lobbyCode: dtoResult.data.lobbyCode });

      const normalizedSettings = normalizeLobbySettings(lobby.settings);

      const dto: GameStartDto = GameStartDtoSchema.parse({
        lobbyCode: dtoResult.data.lobbyCode,
        player: {
          id: socketUserId.trim(),
          telegramId: socketUserId.trim(),
          nickname: '',
          profileImg: '',
          score: 0,
          isReady: false,
          inGame: false,
          loserTask: 'task',
          wasLiar: 0,
          answer: null,
          likes: 0,
          isConfirmed: false,
        },
        settings: normalizedSettings,
      });
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

      // Сразу переводим игру в LIAR_CHOOSES.
      // Эмит stage-change выполнит сам GameService.nextStage, поэтому
      // не отправляем промежуточный статус с LOBBY.
      await gameService.nextStage({ gameId });
      logger.info({ gameId, gameRoomSize }, 'Game started in LIAR_CHOOSES stage');
    } catch (error) {
      logger.error({ error }, 'Error handling game started');
      emitSocketError(socket, "GAME_START_ERROR", error);
    }
  });

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, 'Socket disconnected (lobby handler)');
  });
}
