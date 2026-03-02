import { describe, expect, it } from 'bun:test';
import {
  GameSocketEvents,
  GameStageValues,
  GameStatePayloadSchema,
  JoinLobbySocketPayloadSchema,
  LobbySocketEvents,
  LobbyStatePayloadSchema,
  LobbyStatusValues,
  PROTOCOL_VERSION,
  SocketAckPayloadSchema,
  SocketErrorPayloadSchema,
} from '../../../../../common/message-types';

describe('message-types contracts', () => {
  it('has valid protocol version', () => {
    expect(typeof PROTOCOL_VERSION).toBe('number');
    expect(PROTOCOL_VERSION).toBeGreaterThan(0);
  });

  it('keeps lobby statuses strict', () => {
    expect(LobbyStatusValues).toEqual(['waiting', 'started', 'finished']);
  });

  it('keeps game stages strict', () => {
    expect(GameStageValues).toEqual([
      'lobby',
      'liar_chooses',
      'question_to_liar',
      'question_results',
      'game_results',
      'end',
    ]);
  });

  it('validates lobby payload schemas', () => {
    const join = JoinLobbySocketPayloadSchema.parse({
      lobbyCode: 'ABC123',
      nickname: 'Tester',
    });
    expect(join.lobbyCode).toBe('ABC123');

    const lobby = LobbyStatePayloadSchema.parse({
      lobbyCode: 'ABC123',
      adminId: 'u1',
      status: 'waiting',
      players: [{ id: 'u1', nickname: 'Tester' }],
    });
    expect(lobby.players.length).toBe(1);
  });

  it('validates game state schema', () => {
    const state = GameStatePayloadSchema.parse({
      gameId: 'g1',
      stage: 'liar_chooses',
      players: [{ id: 'u1', nickname: 'A', answer: 1 }],
    });
    expect(state.stage).toBe('liar_chooses');
  });

  it('validates socket utility schemas', () => {
    const ack = SocketAckPayloadSchema.parse({ ok: true });
    expect(ack.ok).toBe(true);

    const err = SocketErrorPayloadSchema.parse({ errorCode: 'X', message: 'X' });
    expect(err.errorCode).toBe('X');
  });

  it('has stable event names', () => {
    expect(GameSocketEvents.GAME_STARTED).toBe('game:started');
    expect(LobbySocketEvents.PLAYER_READY).toBe('lobby:player:ready');
  });
});

