import { GameMessageTypes } from "../../../common/message-types/game.types";
import { GameService } from "../game/game.service";
import type { Server, Socket } from "socket.io";
import { findDiff } from "../common/diff";
import {
  GameLiarChoosesDtoSchema,
  type GameLiarChoosesDto,
} from "../game/dtos/game-liar-chooses.dto";
import {
  GamePlayerVotedDtoSchema,
  type GamePlayerVotedDto,
} from "../game/dtos/game-player-voted.dto";
import {
  GamePlayerSecuredDtoSchema,
  type GamePlayerSecuredDto,
} from "../game/dtos/game-player-secured.dto";
import {
  GamePlayerLikedDtoSchema,
  type GamePlayerLikedDto,
} from "../game/dtos/game-player-liked.dto";
import {
  GameJoinDtoSchema,
  type GameJoinDto,
} from "../game/dtos/game-join.dto";
import {
  GameStageChangedDtoSchema,
  type GameStageChangedDto,
} from "../game/dtos/game-stage-changed.dto";
import { GameInitDtoSchema, type GameInitDto, PlayerInfoSchema } from "../game/dtos/game-init.dto";
import { GameStateDtoSchema, type GameStateDto } from "../game/dtos/game-state.dto";
import { ApiError, buildStatePayload } from "../common/response";
import { GameStartDtoSchema, type GameStartDto } from "../game/dtos/game-start.dto";
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
 * Регистрирует обработчики игровых socket-событий.
 */
export function registerGameHandler(io: Server, socket: Socket) {
  const gameService = new GameService(io);
  const getActiveQuestionText = (game: {
    activeQuestion?: string | null;
    settings?: { deck?: { questions?: Array<{ id: string; content: string }> } };
  }) => {
    const activeQuestionId = game.activeQuestion ?? null;
    if (!activeQuestionId) return null;
    const question = game.settings?.deck?.questions?.find((item) => item.id === activeQuestionId);
    return question?.content ?? null;
  };

  const buildGameStatusPayload = (
    status: GameMessageTypes,
    diff: Record<string, unknown>,
    game: {
      id: string;
      stage?: string;
      liarId?: string | null;
      activeQuestion?: string | null;
      winnerId?: string | null;
      loserId?: string | null;
      loserTask?: string | null;
      settings?: { deck?: { questions?: Array<{ id: string; content: string }> } };
    },
  ) => ({
    ...buildStatePayload(status, diff),
    gameId: game.id,
    stage: game.stage,
    liarId: game.liarId ?? null,
    activeQuestion: game.activeQuestion ?? null,
    activeQuestionText: getActiveQuestionText(game),
    winnerId: game.winnerId ?? null,
    loserId: game.loserId ?? null,
    loserTask: game.loserTask ?? null,
  });

  socket.on(GameMessageTypes.GAME_SUBSCRIBE, async (data: unknown) => {
    try {
      const dtoResult = GameJoinDtoSchema.safeParse(data);
      if (!dtoResult.success) {
        throw new ApiError(422, 'GAME_JOIN_DATA_INVALID', dtoResult.error.issues);
      }

      const { gameId } = dtoResult.data;
      const game = await gameService.findGame(gameId);

      socket.join(gameId);
      socket.emit(GameMessageTypes.GAME_STATE, {
        gameId: game.id,
        stage: game.stage,
        liarId: game.liarId,
        players: game.players,
        activeQuestion: game.activeQuestion,
        activeQuestionText: getActiveQuestionText(game),
        winnerId: game.winnerId ?? null,
        loserId: game.loserId ?? null,
        loserTask: game.loserTask ?? null,
      });

      const roomSize = io.sockets.adapter.rooms.get(gameId)?.size ?? 0;
      logger.info({ gameId, roomSize, socketId: socket.id }, 'Socket subscribed to game room');
    } catch (error) {
      logger.error({ error }, 'Error handling game subscribe');
      emitSocketError(socket, 'GAME_SUBSCRIBE_ERROR', error);
    }
  });

  /**
   * Лжец делает выбор (будет врать или нет)
   */
  socket.on(GameMessageTypes.LIAR_CHOSE, async (data: unknown) => {
    try {
      // Валидация входящих данных через DTO схему
      const dtoResult = GameLiarChoosesDtoSchema.safeParse(data);
      if (!dtoResult.success) {
        throw new ApiError(422, "LIAR_CHOOSES_DATA_INVALID", dtoResult.error.issues);
      }
      const dto: GameLiarChoosesDto = dtoResult.data;
      
      const gameSnap = await gameService.findGame(dto.gameId);
      
      await gameService.liarChooses(dto);
      
      const game = await gameService.findGame(dto.gameId);
      
      socket.join(dto.gameId);
      io.to(dto.gameId).emit(
        "changeGameStatus",
        buildGameStatusPayload(
          GameMessageTypes.LIAR_CHOSE,
          findDiff(gameSnap, game, game.stage),
          game,
        ),
      );
      
      logger.info({ gameId: dto.gameId, answer: dto.answer }, 'Liar chose');
    } catch (error) {
      logger.error({ error }, 'Error handling liar choice');
      emitSocketError(socket, "LIAR_CHOSE_ERROR", error);
    }
  });

  /**
   * Игрок проголосовал (верит или не верит)
   */
  socket.on(GameMessageTypes.PLAYER_VOTED, async (data: unknown) => {
    try {
      // Валидация входящих данных через DTO схему
      const dtoResult = GamePlayerVotedDtoSchema.safeParse(data);
      if (!dtoResult.success) {
        throw new ApiError(422, "PLAYER_VOTED_DATA_INVALID", dtoResult.error.issues);
      }
      const dto: GamePlayerVotedDto = dtoResult.data;
      
      const gameSnap = await gameService.findGame(dto.gameId);
      
      const player = await gameService.setAnswer(dto);
      
      const game = await gameService.findGame(dto.gameId);
      
      socket.join(dto.gameId);
      io.to(dto.gameId).emit(
        "changeGameStatus",
        buildGameStatusPayload(
          GameMessageTypes.PLAYER_VOTED,
          findDiff(gameSnap, game, game.stage),
          game,
        ),
      );
      
      logger.info({ playerId: dto.playerId, gameId: dto.gameId, answer: dto.answer }, 'Player voted');
    } catch (error) {
      logger.error({ error }, 'Error handling player vote');
      emitSocketError(socket, "PLAYER_VOTED_ERROR", error);
    }
  });

  /**
   * Игрок подтвердил свой выбор
   */
  socket.on(GameMessageTypes.PLAYER_SECURED, async (data: unknown) => {
    try {
      // Валидация входящих данных через DTO схему
      const dtoResult = GamePlayerSecuredDtoSchema.safeParse(data);
      if (!dtoResult.success) {
        throw new ApiError(422, "PLAYER_SECURED_DATA_INVALID", dtoResult.error.issues);
      }
      const dto: GamePlayerSecuredDto = dtoResult.data;
      
      const gameSnap = await gameService.findGame(dto.gameId);
      
      const player = await gameService.confirmAnswer(dto);
      
      const game = await gameService.findGame(dto.gameId);
      
      socket.join(dto.gameId);
      io.to(dto.gameId).emit(
        "changeGameStatus",
        buildGameStatusPayload(
          GameMessageTypes.PLAYER_SECURED,
          findDiff(gameSnap, game, game.stage),
          game,
        ),
      );
      
      logger.info({ playerId: dto.playerId, gameId: dto.gameId }, 'Player secured answer');
    } catch (error) {
      logger.error({ error }, 'Error handling player secure');
      emitSocketError(socket, "PLAYER_SECURED_ERROR", error);
    }
  });

  /**
   * Игрок поставил лайк на ответ другого игрока
   */
  socket.on(GameMessageTypes.PLAYER_LIKED, async (data: unknown) => {
    try {
      // Валидация входящих данных через DTO схему
      const dtoResult = GamePlayerLikedDtoSchema.safeParse(data);
      if (!dtoResult.success) {
        throw new ApiError(422, "PLAYER_LIKED_DATA_INVALID", dtoResult.error.issues);
      }
      const dto: GamePlayerLikedDto = dtoResult.data;
      
      const gameSnap = await gameService.findGame(dto.gameId);
      await gameService.likeAnswer(dto);
      const game = await gameService.findGame(dto.gameId);

      socket.join(dto.gameId);
      io.to(dto.gameId).emit(
        "changeGameStatus",
        buildGameStatusPayload(
          GameMessageTypes.PLAYER_LIKED,
          findDiff(gameSnap, game, game.stage),
          game,
        ),
      );
      
      logger.info(
        { senderId: dto.senderId, receiverId: dto.receiverId, gameId: dto.gameId },
        'Player liked answer',
      );
    } catch (error) {
      logger.error({ error }, 'Error handling player like');
      emitSocketError(socket, "PLAYER_LIKED_ERROR", error);
    }
  });
}
