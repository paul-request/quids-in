import { describe, expect, it } from 'vitest';

import {
  applyCupReveal,
  buildFplCupBracket,
  buildQuidsInCupBracket,
  buildSeasonCups,
  cupCoinToss,
  getCupPrizes,
} from './cups';
import type { CupDraw, CupDrawFile } from './cups.interfaces';
import type { FplCupMatch, Gameweek, GameweekScore, Season } from './results.interfaces';

const participants = [1, 2, 3, 4, 5, 6].map((id) => ({
  id,
  name: `Player ${id}`,
  teamName: `Team ${id}`,
}));

// 6 players in an 8-slot bracket: Fixture 1 (1 v 2), Fixture 2 (3 v bye),
// Fixture 3 (4 v 5), Fixture 4 (bye v 6). Rounds: GW10, GW11 (SF), GW12 (Final).
const draw: CupDraw = {
  id: 'quids-in-cup',
  name: 'Quids In Cup',
  revealAfterGameweek: 9,
  round1Fixtures: [
    { fixture: 1, participantIds: [1, 2] },
    { fixture: 2, participantIds: [3, null] },
    { fixture: 3, participantIds: [4, 5] },
    { fixture: 4, participantIds: [null, 6] },
  ],
  startGameweek: 10,
};

function score(points: number, extra: Partial<GameweekScore> = {}): GameweekScore {
  return { points, transferCost: 0, transfers: 0, ...extra };
}

function gameweek(number: number, scores: Record<number, GameweekScore>, ended = true): Gameweek {
  return {
    ended,
    gameweek: number,
    scores: Object.fromEntries(Object.entries(scores).map(([id, value]) => [id, value])),
  };
}

function allScores(points: number): Record<number, GameweekScore> {
  return Object.fromEntries(participants.map(({ id }) => [id, score(points)]));
}

function season(gameweeks: Array<Gameweek>, fplMatches?: Array<FplCupMatch>): Season {
  return {
    gameweeks,
    participants,
    season: '2026-27',
    ...(fplMatches ? { fplCup: { cupLeagueId: 99, matches: fplMatches } } : {}),
  };
}

describe('buildQuidsInCupBracket', () => {
  it('builds rounds with Winner-of placeholders before any cup Gameweek is played', () => {
    const bracket = buildQuidsInCupBracket(draw, season([gameweek(9, allScores(50))]));

    expect(bracket.revealed).toBe(true);
    expect(bracket.rounds.map(({ gameweek: number, name }) => `${name} ${number}`)).toEqual([
      'Quarter-final 10',
      'Semi-final 11',
      'Final 12',
    ]);
    expect(bracket.rounds[0].ties[0]).toMatchObject({ label: 'Fixture 1', status: 'scheduled' });
    expect(bracket.rounds[0].ties[1]).toMatchObject({
      status: 'walkover',
      winnerParticipantId: 3,
    });
    expect(bracket.rounds[1].ties[0].slots).toEqual([
      { kind: 'winner-of', tieLabel: 'Fixture 1' },
      { kind: 'participant', obfuscated: false, participantId: 3 },
    ]);
    expect(bracket.rounds[2].ties[0]).toMatchObject({
      label: 'Final',
      slots: [
        { kind: 'winner-of', tieLabel: 'Semi-final 1' },
        { kind: 'winner-of', tieLabel: 'Semi-final 2' },
      ],
    });
    expect(bracket.championParticipantId).toBeUndefined();
  });

  it('shows provisional scores until the round Gameweek has ended', () => {
    const bracket = buildQuidsInCupBracket(
      draw,
      season([gameweek(9, allScores(50)), gameweek(10, { 1: score(40), 2: score(70) }, false)])
    );
    const tie = bracket.rounds[0].ties[0];

    expect(tie.status).toBe('provisional');
    expect(tie.winnerParticipantId).toBeUndefined();
    expect(tie.slots).toEqual([
      { kind: 'participant', obfuscated: false, participantId: 1, score: 40 },
      { kind: 'participant', obfuscated: false, participantId: 2, score: 70 },
    ]);
    expect(bracket.rounds[1].ties[0].slots[0]).toEqual({
      kind: 'winner-of',
      tieLabel: 'Fixture 1',
    });
  });

  it('decides on net points and advances winners through to a champion', () => {
    const bracket = buildQuidsInCupBracket(
      draw,
      season([
        gameweek(9, allScores(50)),
        gameweek(10, { 1: score(40), 2: score(70), 4: score(55), 5: score(54) }),
        gameweek(11, { 2: score(60), 3: score(61), 4: score(30), 6: score(80) }),
        gameweek(12, { 3: score(90), 6: score(20) }),
      ])
    );

    expect(bracket.rounds[0].ties.map(({ winnerParticipantId }) => winnerParticipantId)).toEqual([
      2, 3, 4, 6,
    ]);
    expect(bracket.rounds[1].ties.map(({ winnerParticipantId }) => winnerParticipantId)).toEqual([
      3, 6,
    ]);
    expect(bracket.rounds[2].ties[0]).toMatchObject({ status: 'decided', winnerParticipantId: 3 });
    expect(bracket.rounds[0].ties[0].tieBreak).toBeUndefined();
    expect(bracket.championParticipantId).toBe(3);
  });

  it('breaks level scores on goals scored, then goals conceded, then a coin toss', () => {
    const bracket = buildQuidsInCupBracket(
      draw,
      season([
        gameweek(9, allScores(50)),
        gameweek(10, {
          1: score(50, { goalsConceded: 5, goalsScored: 2 }),
          2: score(50, { goalsConceded: 1, goalsScored: 3 }),
          4: score(50, { goalsConceded: 2, goalsScored: 1 }),
          5: score(50, { goalsConceded: 4, goalsScored: 1 }),
        }),
        gameweek(11, {
          2: score(60, { goalsConceded: 1, goalsScored: 1 }),
          3: score(60, { goalsConceded: 1, goalsScored: 1 }),
        }),
      ])
    );

    expect(bracket.rounds[0].ties[0]).toMatchObject({
      tieBreak: 'goals-scored',
      winnerParticipantId: 2,
    });
    expect(bracket.rounds[0].ties[2]).toMatchObject({
      tieBreak: 'goals-conceded',
      winnerParticipantId: 4,
    });
    expect(bracket.rounds[1].ties[0]).toMatchObject({
      tieBreak: 'coin-toss',
      winnerParticipantId: cupCoinToss('2026-27', 'quids-in-cup', 11, 2, 3),
    });
  });

  it('gives the tie to the participant with a score when the other has none', () => {
    const bracket = buildQuidsInCupBracket(
      draw,
      season([gameweek(9, allScores(50)), gameweek(10, { 2: score(10), 3: score(10) })])
    );

    expect(bracket.rounds[0].ties[0]).toMatchObject({
      tieBreak: 'missing-score',
      winnerParticipantId: 2,
    });
    expect(bracket.rounds[0].ties[2]).toMatchObject({
      tieBreak: 'coin-toss',
      winnerParticipantId: cupCoinToss('2026-27', 'quids-in-cup', 10, 4, 5),
    });
  });

  it('rejects invalid draws', () => {
    const base = season([]);

    expect(() =>
      buildQuidsInCupBracket(
        { ...draw, round1Fixtures: [{ fixture: 1, participantIds: [null, null] }] },
        base
      )
    ).toThrow('cannot be two byes');
    expect(() =>
      buildQuidsInCupBracket(
        { ...draw, round1Fixtures: [{ fixture: 1, participantIds: [1, 99] }] },
        base
      )
    ).toThrow('unknown participant 99');
    expect(() =>
      buildQuidsInCupBracket(
        {
          ...draw,
          round1Fixtures: [
            { fixture: 1, participantIds: [1, 2] },
            { fixture: 2, participantIds: [1, 3] },
          ],
        },
        base
      )
    ).toThrow('more than once');
    expect(() =>
      buildQuidsInCupBracket({ ...draw, round1Fixtures: draw.round1Fixtures.slice(0, 3) }, base)
    ).toThrow('power-of-two');
  });
});

describe('applyCupReveal', () => {
  it('obfuscates the real Round 1 pairings until the reveal Gameweek has ended', () => {
    const bracket = applyCupReveal(
      buildQuidsInCupBracket(draw, season([gameweek(9, allScores(50), false)]))
    );

    expect(bracket.revealed).toBe(false);
    expect(bracket.rounds[0].ties[0]).toEqual({
      label: 'Fixture 1',
      slots: [
        { kind: 'participant', obfuscated: true, participantId: 1 },
        { kind: 'participant', obfuscated: true, participantId: 2 },
      ],
      status: 'obfuscated',
    });
    expect(bracket.rounds[0].ties[1].slots[1]).toEqual({ kind: 'bye', obfuscated: true });
    expect(bracket.rounds[1].ties[0].slots).toEqual([
      { kind: 'winner-of', tieLabel: 'Fixture 1' },
      { kind: 'participant', obfuscated: true, participantId: 3 },
    ]);
    expect(bracket.rounds[1].ties[0].status).toBe('scheduled');
    expect(bracket.rounds[1].ties[1].slots).toEqual([
      { kind: 'winner-of', tieLabel: 'Fixture 3' },
      { kind: 'participant', obfuscated: true, participantId: 6 },
    ]);
    expect(bracket.rounds[2].ties[0].slots).toEqual([
      { kind: 'winner-of', tieLabel: 'Semi-final 1' },
      { kind: 'winner-of', tieLabel: 'Semi-final 2' },
    ]);
    expect(bracket.championParticipantId).toBeUndefined();
  });

  it('keeps byes as walkovers into the next round once revealed', () => {
    const bracket = applyCupReveal(buildQuidsInCupBracket(draw, season([gameweek(9, {})])));

    expect(bracket.rounds[1].ties[0].slots[1]).toEqual({
      kind: 'participant',
      obfuscated: false,
      participantId: 3,
    });
    expect(bracket.rounds[1].ties[1].slots[1]).toEqual({
      kind: 'participant',
      obfuscated: false,
      participantId: 6,
    });
  });

  it('obfuscates before the reveal Gameweek has been recorded at all', () => {
    const bracket = applyCupReveal(buildQuidsInCupBracket(draw, season([])));

    expect(bracket.rounds[0].ties.every(({ status }) => status === 'obfuscated')).toBe(true);
  });

  it('returns the bracket unchanged once revealed', () => {
    const bracket = buildQuidsInCupBracket(draw, season([gameweek(9, allScores(50))]));

    expect(applyCupReveal(bracket)).toBe(bracket);
  });
});

describe('buildFplCupBracket', () => {
  it('shows a to-be-drawn bracket until FPL creates the cup', () => {
    const bracket = buildFplCupBracket(season([]));

    expect(bracket).toMatchObject({
      drawAvailable: false,
      name: 'FPL League Cup',
      revealAfterGameweek: 34,
      revealed: false,
      startGameweek: 35,
    });
    expect(bracket.rounds.map(({ gameweek: number, name }) => `${name} ${number}`)).toEqual([
      'Round 1 35',
      'Quarter-final 36',
      'Semi-final 37',
      'Final 38',
    ]);
    expect(bracket.rounds[0].ties[0].slots).toEqual([
      { kind: 'to-be-drawn' },
      { kind: 'to-be-drawn' },
    ]);
    expect(applyCupReveal(bracket)).toBe(bracket);
  });

  it('uses FPL matches and winners, deriving placeholders for unpublished rounds', () => {
    const matches: Array<FplCupMatch> = [
      {
        entry1: 1,
        entry1Points: 50,
        entry2: 2,
        entry2Points: 50,
        gameweek: 35,
        id: 11,
        isBye: false,
        winner: 2,
      },
      {
        entry1: 3,
        entry1Points: null,
        entry2: null,
        entry2Points: null,
        gameweek: 35,
        id: 12,
        isBye: true,
        winner: null,
      },
      {
        entry1: 4,
        entry1Points: 30,
        entry2: 5,
        entry2Points: 45,
        gameweek: 35,
        id: 13,
        isBye: false,
        winner: null,
      },
      {
        entry1: 6,
        entry1Points: 0,
        entry2: null,
        entry2Points: null,
        gameweek: 35,
        id: 14,
        isBye: true,
        winner: 6,
      },
    ];
    const bracket = buildFplCupBracket(
      season([gameweek(34, allScores(50)), gameweek(35, allScores(50), false)], matches)
    );

    expect(bracket.revealed).toBe(true);
    expect(bracket.rounds.map(({ name }) => name)).toEqual([
      'Quarter-final',
      'Semi-final',
      'Final',
    ]);
    expect(bracket.rounds[0].ties.map(({ status }) => status)).toEqual([
      'decided',
      'walkover',
      'provisional',
      'walkover',
    ]);
    expect(bracket.rounds[0].ties[1].winnerParticipantId).toBe(3);
    expect(bracket.rounds[1].ties[0].slots).toEqual([
      { kind: 'participant', obfuscated: false, participantId: 2 },
      { kind: 'participant', obfuscated: false, participantId: 3 },
    ]);
    expect(bracket.rounds[1].ties[1].slots).toEqual([
      { kind: 'winner-of', tieLabel: 'Fixture 3' },
      { kind: 'participant', obfuscated: false, participantId: 6 },
    ]);
  });

  it('prefers published FPL fixtures and FPL champion for later rounds', () => {
    const matches: Array<FplCupMatch> = [
      {
        entry1: 1,
        entry1Points: 60,
        entry2: 2,
        entry2Points: 50,
        gameweek: 37,
        id: 1,
        isBye: false,
        winner: 1,
      },
      {
        entry1: 3,
        entry1Points: 60,
        entry2: 4,
        entry2Points: 50,
        gameweek: 37,
        id: 2,
        isBye: false,
        winner: 3,
      },
      {
        entry1: 3,
        entry1Points: 70,
        entry2: 1,
        entry2Points: 70,
        gameweek: 38,
        id: 3,
        isBye: false,
        winner: 1,
      },
    ];
    const bracket = buildFplCupBracket(
      season(
        [gameweek(36, allScores(1)), gameweek(37, allScores(1)), gameweek(38, allScores(1))],
        matches
      )
    );

    expect(bracket.startGameweek).toBe(37);
    expect(bracket.rounds[1].ties[0].slots[0]).toMatchObject({ participantId: 3, score: 70 });
    expect(bracket.championParticipantId).toBe(1);
  });

  it('rejects matches with unknown entries', () => {
    expect(() =>
      buildFplCupBracket(
        season(
          [],
          [
            {
              entry1: 1,
              entry1Points: 0,
              entry2: 77,
              entry2Points: 0,
              gameweek: 35,
              id: 1,
              isBye: false,
              winner: null,
            },
          ]
        )
      )
    ).toThrow('unknown entry 77');
  });
});

describe('buildSeasonCups and getCupPrizes', () => {
  const drawFile: CupDrawFile = {
    cups: [draw],
    generatedAt: '2026-09-29T00:00:00Z',
    season: '2026-27',
  };

  it('orders cups by start Gameweek and has no cups for a season without a draw', () => {
    expect(buildSeasonCups(drawFile, season([])).map(({ id }) => id)).toEqual([
      'quids-in-cup',
      'fpl-league-cup',
    ]);
    expect(
      buildSeasonCups({ ...drawFile, season: '2025-26' }, season([])).map(({ id }) => id)
    ).toEqual([]);
  });

  it('maps champions to cup prizes', () => {
    const cups = buildSeasonCups(drawFile, season([]));

    expect(getCupPrizes(cups)).toEqual([
      { startGameweek: 10, winnerParticipantId: undefined },
      { startGameweek: 35, winnerParticipantId: undefined },
    ]);
  });
});

describe('cupCoinToss', () => {
  it('is deterministic and independent of slot order', () => {
    const winner = cupCoinToss('2026-27', 'quids-in-cup', 16, 10, 20);

    expect([10, 20]).toContain(winner);
    expect(cupCoinToss('2026-27', 'quids-in-cup', 16, 20, 10)).toBe(winner);
    expect(cupCoinToss('2026-27', 'quids-in-cup', 16, 10, 20)).toBe(winner);
  });
});
