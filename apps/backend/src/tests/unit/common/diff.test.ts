import { describe, expect, it } from 'bun:test';
import { findDiff } from '../../../common/diff';

describe('findDiff', () => {
  it('returns primitive diff only when changed', () => {
    expect(findDiff(1, 2)).toBe(2);
    expect(findDiff('x', 'x')).toBeUndefined();
  });

  it('returns all new array items if old is not an array', () => {
    expect(findDiff({}, { items: [1, 2] })).toEqual({ items: [1, 2] });
  });

  it('handles array of objects by id including updates/new/removals', () => {
    const oldObj = { players: [{ id: '1', score: 0 }, { id: '2', score: 1 }] };
    const newObj = { players: [{ id: '1', score: 2 }, { id: '3', score: 3 }] };

    const diff = findDiff(oldObj, newObj);

    expect(diff.players).toEqual([
      { id: '1', score: 2 },
      { id: '3', score: 3 },
      { id: '2', _removed: true },
    ]);
  });

  it('handles arrays with primitives and objects without id', () => {
    const oldObj = { values: [1, { name: 'a' }] };
    const newObj = { values: [1, 2, { name: 'a' }, { name: 'b' }] };

    const diff = findDiff(oldObj, newObj);

    expect(diff.values).toEqual([2, { name: 'b' }]);
  });

  it('filters hidden fields during gameplay', () => {
    const oldObj = { doLie: false, liarId: 'a', players: [{ id: '1', score: 0 }], stage: 'lobby' };
    const newObj = { doLie: true, liarId: 'b', players: [{ id: '1', score: 10 }], stage: 'question_to_liar' };

    const diff = findDiff(oldObj, newObj, 'QUESTION_TO_LIAR');

    expect(diff.doLie).toBeUndefined();
    expect(diff.liarId).toBeUndefined();
    expect(diff.players).toEqual([{ id: '1', score: 10 }]);
    expect(diff.stage).toBe('question_to_liar');
  });

  it('returns only game result fields on game results stage', () => {
    const oldObj = {
      stage: 'question_results',
      players: [{ id: '1', score: 10 }],
      doLie: null,
      loserTask: null,
      winnerId: null,
      loserId: null,
      activeQuestion: 'q1',
    };

    const newObj = {
      stage: 'game_results',
      players: [{ id: '1', score: 20 }],
      doLie: true,
      loserTask: 'task',
      winnerId: '1',
      loserId: '2',
      activeQuestion: 'q2',
    };

    const diff = findDiff(oldObj, newObj, 'game_results');

    expect(diff).toEqual({
      stage: 'game_results',
      doLie: true,
      loserTask: 'task',
      winnerId: '1',
      loserId: '2',
    });
  });
});
