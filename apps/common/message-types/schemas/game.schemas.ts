import { z } from 'zod';
import { GameStageValues } from '../contracts/game.contracts';
import { LobbyDiffPayloadSchema, LobbyPlayerPayloadSchema } from './lobby.schemas';

/**
 * Runtime-схема игрока в игровом контексте.
 */
export const GamePlayerPayloadSchema = LobbyPlayerPayloadSchema.extend({
  answer: z.union([z.literal(0), z.literal(1), z.null()]).optional(),
  likes: z.number().optional(),
  isConfirmed: z.boolean().nullable().optional(),
  score: z.number().optional(),
});

/**
 * Runtime-схема полного состояния игры.
 */
export const GameStatePayloadSchema = z.object({
  gameId: z.string().min(1),
  stage: z.enum(GameStageValues).optional(),
  stageStartedAt: z.number().optional(),
  stageDurationMs: z.number().nullable().optional(),
  liarId: z.string().nullable().optional(),
  activeQuestion: z.string().nullable().optional(),
  activeQuestionText: z.string().nullable().optional(),
  winnerId: z.string().nullable().optional(),
  loserId: z.string().nullable().optional(),
  loserTask: z.string().nullable().optional(),
  players: z.array(GamePlayerPayloadSchema).optional(),
});

/**
 * Runtime-схема payload подписки на игру.
 */
export const GameSubscribeSocketPayloadSchema = z.object({
  gameId: z.string().min(1),
});

/**
 * Runtime-схема payload выбора лжеца.
 */
export const LiarChoseSocketPayloadSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  answer: z.boolean(),
});

/**
 * Runtime-схема payload голоса решалы.
 */
export const PlayerVotedSocketPayloadSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  answer: z.union([z.literal(0), z.literal(1)]),
});

/**
 * Runtime-схема payload фиксации ответа.
 */
export const PlayerSecuredSocketPayloadSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
});

/**
 * Runtime-схема payload лайка игроку.
 */
export const PlayerLikedSocketPayloadSchema = z.object({
  gameId: z.string().min(1),
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
});

/**
 * Runtime-схема diff-обновления игровой фазы.
 */
export const GameStatusDiffPayloadSchema = LobbyDiffPayloadSchema.extend({
  stage: z.enum(GameStageValues).optional(),
  activeQuestion: z.string().nullable().optional(),
  winnerId: z.string().nullable().optional(),
  loserId: z.string().nullable().optional(),
  loserTask: z.string().nullable().optional(),
  players: z.array(GamePlayerPayloadSchema.partial().extend({
    id: z.string().optional(),
    _removed: z.boolean().optional(),
  })).optional(),
});

/**
 * Runtime-схема системного события изменения состояния игры.
 */
export const GameStatusChangedPayloadSchema = GameStatePayloadSchema.partial().extend({
  status: z.string().optional(),
  diff: GameStatusDiffPayloadSchema.optional(),
});

