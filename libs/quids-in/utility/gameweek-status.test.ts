import { describe, expect, it } from 'vitest';

import { isCurrentGameweekInProgress } from './gameweek-status';
import type { Gameweek } from './results.interfaces';

describe('isCurrentGameweekInProgress', () => {
  it.each([
    ['not started', false, false, false],
    ['live or between matches', true, false, true],
    ['finished but unchecked', true, false, true],
    ['finished and checked', true, true, false],
    ['unknown start', undefined, false, false],
    ['unknown completion', true, undefined, false],
    ['legacy metadata', undefined, undefined, false],
  ])('%s', (_description, started, ended, expected) => {
    const gameweek: Gameweek = { ended, gameweek: 2, scores: {}, started };

    expect(isCurrentGameweekInProgress(gameweek, gameweek)).toBe(expected);
  });

  it.each([false, true])('hides an earlier selected Gameweek with ended=%s', (ended) => {
    const selected: Gameweek = { ended, gameweek: 1, scores: {}, started: true };
    const latest: Gameweek = { ...selected, gameweek: 2 };

    expect(isCurrentGameweekInProgress(selected, latest)).toBe(false);
  });

  it('hides the badge when either Gameweek is unavailable', () => {
    const gameweek: Gameweek = { ended: false, gameweek: 1, scores: {}, started: true };

    expect(isCurrentGameweekInProgress(undefined, undefined)).toBe(false);
    expect(isCurrentGameweekInProgress(gameweek, undefined)).toBe(false);
    expect(isCurrentGameweekInProgress(undefined, gameweek)).toBe(false);
  });
});
