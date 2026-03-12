import { z } from 'zod';
import { GameStageValues } from '../contracts/game.contracts';
import { LobbyStatusValues } from '../contracts/lobby.contracts';

/**
 * Runtime-схема игрока в лобби.
 */
export const LobbyPlayerPayloadSchema = z.object({
  id: z.string().min(1),
  nickname: z.string().min(1),
  profileImg: z.string().optional(),
  isReady: z.boolean().optional(),
  inGame: z.boolean().optional(),
  loserTask: z.string().nullable().optional(),
});

/**
 * Runtime-схема полного состояния лобби.
 */
export const LobbyStatePayloadSchema = z.object({
  lobbyCode: z.string().min(1),
  adminId: z.string().min(1),
  currentGameId: z.string().nullable().optional(),
  status: z.enum(LobbyStatusValues),
  players: z.array(LobbyPlayerPayloadSchema),
});

/**
 * Runtime-схема payload входа игрока в лобби.
 */
export const JoinLobbySocketPayloadSchema = z.object({
  lobbyCode: z.string().min(1),
  nickname: z.string().min(1).optional(),
  profileImg: z.string().optional(),
  loserTask: z.string().optional(),
});

/**
 * Runtime-схема payload с кодом лобби.
 */
export const LobbyCodePayloadSchema = z.object({
  lobbyCode: z.string().min(1),
});

/**
 * Runtime-схема payload переключения ready.
 */
export const ToggleReadySocketPayloadSchema = z.object({
  lobbyCode: z.string().min(1),
  playerId: z.string().min(1).optional(),
  loserTask: z.string().nullable().optional(),
});

/**
 * Runtime-схема игрока в lobby diff.
 */
export const LobbyDiffPlayerPayloadSchema = LobbyPlayerPayloadSchema.partial().extend({
  id: z.string().optional(),
  _removed: z.boolean().optional(),
});

/**
 * Runtime-схема diff-обновления лобби.
 */
export const LobbyDiffPayloadSchema = z.object({
  lobbyCode: z.string().optional(),
  adminId: z.string().optional(),
  currentGameId: z.string().nullable().optional(),
  status: z.enum(LobbyStatusValues).optional(),
  players: z.array(LobbyDiffPlayerPayloadSchema).optional(),
  stage: z.enum(GameStageValues).optional(),
});

/**
 * Runtime-схема системного события изменения состояния лобби.
 */
export const LobbyStatusChangedPayloadSchema = z.object({
  status: z.string().optional(),
  diff: LobbyDiffPayloadSchema.optional(),
  stage: z.enum(GameStageValues).optional(),
});
