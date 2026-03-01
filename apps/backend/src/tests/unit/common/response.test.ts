import { describe, expect, it } from 'bun:test';
import { GameMessageTypes } from '../../../../../common/message-types/enums/game.types';
import { ApiError, buildStatePayload, error, success } from '../../../common/response';

describe('response helpers', () => {
  it('builds success payload', () => {
    const response = success({ ok: true });
    expect(String(response.status)).toBe('success');
    expect(response.payload).toEqual({ ok: true });
  });

  it('builds error payload with defaults', () => {
    const response = error(401, 'UNAUTHORIZED');
    expect(String(response.status)).toBe('error');
    expect(response.code).toBe(401);
    expect(response.errorCode).toBe('UNAUTHORIZED');
    expect(response.message).toBe('UNAUTHORIZED');
    expect(response.payload).toBeNull();
  });

  it('builds error payload with custom message/details', () => {
    const details = { field: 'initData' };
    const response = error(422, 'INVALID', 'bad request', details);
    expect(response.message).toBe('bad request');
    expect(response.details).toEqual(details);
  });

  it('builds state payload', () => {
    const payload = buildStatePayload(GameMessageTypes.STAGE_CHANGED, { stage: 'lobby' });
    expect(payload).toEqual({ status: GameMessageTypes.STAGE_CHANGED, diff: { stage: 'lobby' } });
  });

  it('creates ApiError with fallback message', () => {
    const err = new ApiError(404, 'NOT_FOUND');
    expect(err.code).toBe(404);
    expect(err.errorCode).toBe('NOT_FOUND');
    expect(err.message).toBe('NOT_FOUND');
  });

  it('creates ApiError with custom message and details', () => {
    const err = new ApiError(409, 'CONFLICT', { id: '1' }, 'custom');
    expect(err.code).toBe(409);
    expect(err.errorCode).toBe('CONFLICT');
    expect(err.details).toEqual({ id: '1' });
    expect(err.message).toBe('custom');
  });
});
