import { describe, expect, it } from 'vitest';

import {
  calculateGameweekResult,
  calculateAverageWeeklyPosition,
  calculateGameweekStats,
  calculatePlayerStats,
  calculateSeasonBalances,
  calculateBiggestSlugs,
  calculateSeasonLeaderboard,
  calculateTeamValue,
} from './results';
import type { Gameweek, Participant } from './results.interfaces';

const participants: Array<Participant> = [
  { id: 1, name: 'Alice', teamName: 'Aces High' },
  { id: 2, name: 'Ben', teamName: 'Biscuit Boys' },
  { id: 3, name: 'Chloe', teamName: 'Chilli Chasers' },
];

function gameweek(scores: Record<string, number>): Gameweek {
  return { gameweek: 1, scores: createScores(scores) };
}

function createScores(
  pointsByParticipant: Record<string, number>,
  transfersByParticipant: Record<string, number> = {}
): Gameweek['scores'] {
  return Object.fromEntries(
    Object.entries(pointsByParticipant).map(([participantId, points]) => [
      participantId,
      {
        points,
        transfers: transfersByParticipant[participantId] ?? 0,
        transferCost: 0,
      },
    ])
  );
}

describe('calculateGameweekResult', () => {
  it('returns the clear winner and last-place participant', () => {
    const result = calculateGameweekResult(participants, gameweek({ '1': 72, '2': 68, '3': 61 }));

    expect(result).toEqual({
      highestScore: 72,
      winners: [{ participantId: 1, winShare: 1 }],
      lowestScore: 61,
      lastPlaceParticipantIds: [3],
    });

  });

  it('splits a two-way winning tie equally', () => {
    const result = calculateGameweekResult(participants, gameweek({ '1': 72, '2': 72, '3': 61 }));

    expect(result.winners).toEqual([
      { participantId: 1, winShare: 0.5 },
      { participantId: 2, winShare: 0.5 },
    ]);
  });

  describe('calculateGameweekStats', () => {
    it('derives selected-Gameweek metrics and includes it in the season benchmark', () => {
      const firstGameweek = gameweek({ '1': 10, '2': 40, '3': 70 });
      const secondGameweek: Gameweek = {
        gameweek: 2,
        scores: createScores({ '1': 10, '2': 50, '3': 90 }),
      };

      const result = calculateGameweekStats(participants, [firstGameweek, secondGameweek], secondGameweek);

      expect(result).toEqual({
        available: true,
        highestScore: 90,
        leagueAverage: 50,
        lowestScore: 10,
        spread: 80,
        varianceFromSeasonAverage: 5,
      });

    });

    it('excludes missing scores and preserves decimal variance', () => {
      const firstGameweek = gameweek({ '1': 10, '2': 20 });
      const secondGameweek: Gameweek = {
        gameweek: 2,
        scores: createScores({ '1': 20, '3': 31 }),
      };

      const result = calculateGameweekStats(participants, [firstGameweek, secondGameweek], secondGameweek);

      expect(result).toEqual({
        available: true,
        highestScore: 31,
        leagueAverage: 25.5,
        lowestScore: 20,
        spread: 11,
        varianceFromSeasonAverage: 5.25,
      });
    });

    it('returns an unavailable result when the selected Gameweek has no usable scores', () => {
      const firstGameweek = gameweek({ '1': 10, '2': 20 });
      const secondGameweek: Gameweek = { gameweek: 2, scores: {} };

      const result = calculateGameweekStats(participants, [firstGameweek, secondGameweek], secondGameweek);

      expect(result).toEqual({ available: false });
    });

    it('rejects a selected Gameweek number that is not part of the recorded season', () => {
      const recordedGameweek = gameweek({ '1': 10, '2': 20 });
      const selectedGameweek: Gameweek = {
        gameweek: 99,
        scores: createScores({ '1': 10, '2': 20 }),
      };

      expect(() =>
        calculateGameweekStats(participants, [recordedGameweek], selectedGameweek)
      ).toThrow('Selected Gameweek must belong to the recorded season');
    });

    it('accepts a selected Gameweek object that is a different reference to the same recorded Gameweek', () => {
      const recordedGameweek = gameweek({ '1': 10, '2': 20 });
      const clonedSelectedGameweek: Gameweek = JSON.parse(JSON.stringify(recordedGameweek));

      const result = calculateGameweekStats(
        participants,
        [recordedGameweek],
        clonedSelectedGameweek
      );

      expect(result).toEqual({
        available: true,
        highestScore: 20,
        leagueAverage: 15,
        lowestScore: 10,
        spread: 10,
        varianceFromSeasonAverage: 0,
      });
    });
  });

  it('splits a three-way winning tie into thirds', () => {
    const result = calculateGameweekResult(participants, gameweek({ '1': 72, '2': 72, '3': 72 }));

    expect(result.winners).toEqual([
      { participantId: 1, winShare: 1 / 3 },
      { participantId: 2, winShare: 1 / 3 },
      { participantId: 3, winShare: 1 / 3 },
    ]);
  });

  it('returns all participants tied for last place', () => {
    const result = calculateGameweekResult(participants, gameweek({ '1': 72, '2': 61, '3': 61 }));

    expect(result.lastPlaceParticipantIds).toEqual([2, 3]);
  });

  it('treats missing scores as zero', () => {
    const result = calculateGameweekResult(participants, gameweek({ '1': 72 }));

    expect(result.lowestScore).toBe(0);
    expect(result.lastPlaceParticipantIds).toEqual([2, 3]);
  });

  it('rejects an empty score map', () => {
    expect(() => calculateGameweekResult(participants, gameweek({}))).toThrow(
      'A Gameweek must contain at least one score'
    );
  });

  it('rejects invalid participant IDs and scores', () => {
    expect(() => calculateGameweekResult(participants, gameweek({ '4': 72 }))).toThrow(
      'Invalid participant ID in scores: 4'
    );
    expect(() => calculateGameweekResult(participants, gameweek({ '1': Number.NaN }))).toThrow(
      'Invalid score for participant 1'
    );
  });

  it('rejects non-canonical score keys', () => {
    expect(() => calculateGameweekResult(participants, gameweek({ '01': 72 }))).toThrow(
      'Invalid participant ID in scores: 01'
    );
  });

  it('rejects malformed participant and Gameweek input', () => {
    expect(() =>
      calculateGameweekResult(null as unknown as Array<Participant>, gameweek({ '1': 72 }))
    ).toThrow('participants must be an array');
    expect(() => calculateGameweekResult([], gameweek({ '1': 72 }))).toThrow(
      'At least one participant is required'
    );
    expect(() =>
      calculateGameweekResult(
        [{ id: '1', name: 'Alice', teamName: 'Aces High' }] as unknown as Array<Participant>,
        gameweek({ '1': 72 })
      )
    ).toThrow('Invalid participant ID: 1');
    expect(() =>
      calculateGameweekResult(participants, { gameweek: 1, scores: [] } as unknown as Gameweek)
    ).toThrow('A Gameweek must contain a score map');
    expect(() =>
      calculateGameweekResult(participants, {
        gameweek: Number.NaN,
        scores: createScores({ '1': 72 }),
      })
    ).toThrow('Invalid Gameweek number: NaN');
  });
});

describe('calculateSeasonLeaderboard', () => {
  it('aggregates fractional wins and identifies season last place', () => {
    const gameweeks: Array<Gameweek> = [
      gameweek({ '1': 72, '2': 72, '3': 61 }),
      { gameweek: 2, scores: createScores({ '1': 60, '2': 61, '3': 60 }) },
    ];

    const result = calculateSeasonLeaderboard(participants, gameweeks);

    expect(result.rows).toEqual([
      { participantId: 2, totalWins: 1.5 },
      { participantId: 1, totalWins: 0.5 },
      { participantId: 3, totalWins: 0 },
    ]);
    expect(result.lastPlaceParticipantIds).toEqual([3]);
  });

  describe('calculateAverageWeeklyPosition', () => {
    it('uses competition ranking and averages positions across Gameweeks', () => {
      const result = calculateAverageWeeklyPosition(participants, [
        gameweek({ '1': 72, '2': 61, '3': 61 }),
        { gameweek: 2, scores: createScores({ '1': 50, '2': 70, '3': 40 }) },
      ]);

      expect(result).toEqual([
        { participantId: 1, averagePosition: 1.5, averageWeeklyScore: 61 },
        { participantId: 2, averagePosition: 1.5, averageWeeklyScore: 65.5 },
        { participantId: 3, averagePosition: 2.5, averageWeeklyScore: 50.5 },
      ]);
    });

    it('gives every participant in a three-way tie the same competition position', () => {
      const fourParticipants = [
        ...participants,
        { id: 4, name: 'Daniel', teamName: 'Dazzle United' },
      ];
      const result = calculateAverageWeeklyPosition(fourParticipants, [
        { gameweek: 1, scores: createScores({ '1': 72, '2': 72, '3': 72, '4': 50 }) },
      ]);

      expect(result).toEqual([
        { participantId: 1, averagePosition: 1, averageWeeklyScore: 72 },
        { participantId: 2, averagePosition: 1, averageWeeklyScore: 72 },
        { participantId: 3, averagePosition: 1, averageWeeklyScore: 72 },
        { participantId: 4, averagePosition: 4, averageWeeklyScore: 50 },
      ]);
    });

    describe('calculateSeasonBalances', () => {
      it('awards the full pot to a sole winner', () => {
        const result = calculateSeasonBalances(participants, [
          gameweek({ '1': 72, '2': 61, '3': 50 }),
        ]);

        expect(result).toEqual([
          {
            participantId: 1,
            grossWinningsPennies: 300,
            netBalancePennies: -3500,
            weeklyBalancePennies: 200,
          },
          {
            participantId: 2,
            grossWinningsPennies: 0,
            netBalancePennies: -3800,
            weeklyBalancePennies: -100,
          },
          {
            participantId: 3,
            grossWinningsPennies: 0,
            netBalancePennies: -3800,
            weeklyBalancePennies: -100,
          },
        ]);
      });

      it('splits tied pots in whole pennies and preserves participant order', () => {
        const result = calculateSeasonBalances(
          [...participants, { id: 4, name: 'Daniel', teamName: 'Dazzle United' }],
          [
            {
              gameweek: 1,
              scores: createScores({ '1': 72, '2': 72, '3': 72, '4': 61 }),
            },
          ]
        );

        expect(result.slice(0, 3)).toEqual([
          {
            participantId: 1,
            grossWinningsPennies: 134,
            netBalancePennies: -3666,
            weeklyBalancePennies: 34,
          },
          {
            participantId: 2,
            grossWinningsPennies: 133,
            netBalancePennies: -3667,
            weeklyBalancePennies: 33,
          },
          {
            participantId: 3,
            grossWinningsPennies: 133,
            netBalancePennies: -3667,
            weeklyBalancePennies: 33,
          },
        ]);
        expect(result.reduce((total, row) => total + row.grossWinningsPennies, 0)).toBe(400);
      });

      it('bases the current balance on the number of recorded Gameweeks, not the Gameweek number', () => {
        const result = calculateSeasonBalances(participants, [
          gameweek({ '1': 72, '2': 61, '3': 50 }),
          { gameweek: 5, scores: createScores({ '1': 60, '2': 61, '3': 70 }) },
        ]);

        expect(result.find((row) => row.participantId === 3)).toEqual({
          participantId: 3,
          grossWinningsPennies: 300,
          netBalancePennies: -3500,
          weeklyBalancePennies: 100,
        });
      });

      it('deducts the season contribution once and handles an empty season', () => {
        expect(calculateSeasonBalances(participants, [])).toEqual([
          {
            participantId: 1,
            grossWinningsPennies: 0,
            netBalancePennies: -3800,
            weeklyBalancePennies: 0,
          },
          {
            participantId: 2,
            grossWinningsPennies: 0,
            netBalancePennies: -3800,
            weeklyBalancePennies: 0,
          },
          {
            participantId: 3,
            grossWinningsPennies: 0,
            netBalancePennies: -3800,
            weeklyBalancePennies: 0,
          },
        ]);
      });
    });

    it('treats missing scores as zero and includes every participant', () => {
      const result = calculateAverageWeeklyPosition(participants, [
        gameweek({ '1': 72, '2': 61 }),
        { gameweek: 2, scores: createScores({ '1': 50, '3': 40 }) },
      ]);

      expect(result).toEqual([
        { participantId: 1, averagePosition: 1, averageWeeklyScore: 61 },
        { participantId: 2, averagePosition: 2.5, averageWeeklyScore: 61 },
        { participantId: 3, averagePosition: 2.5, averageWeeklyScore: 40 },
      ]);
    });

    it('keeps participant order for equal averages and omits empty participants', () => {
      const result = calculateAverageWeeklyPosition(participants, [gameweek({ '1': 50, '2': 50 })]);

      expect(result).toEqual([
        { participantId: 1, averagePosition: 1, averageWeeklyScore: 50 },
        { participantId: 2, averagePosition: 1, averageWeeklyScore: 50 },
        { participantId: 3, averagePosition: 3, averageWeeklyScore: undefined },
      ]);
    });

    it('returns no rows for an empty season', () => {
      expect(calculateAverageWeeklyPosition(participants, [])).toEqual([]);
    });
  });

  describe('calculateBiggestSlugs', () => {
    it('orders participants by the number of last-place finishes', () => {
      const result = calculateBiggestSlugs(participants, [
        gameweek({ '1': 72, '2': 68, '3': 61 }),
        { gameweek: 2, scores: createScores({ '1': 60, '2': 61, '3': 60 }) },
        { gameweek: 3, scores: createScores({ '1': 50, '2': 50, '3': 61 }) },
      ]);

      expect(result).toEqual([
        { participantId: 1, weeklyLosses: 2 },
        { participantId: 3, weeklyLosses: 2 },
        { participantId: 2, weeklyLosses: 1 },
      ]);
    });

    it('counts tied last-place finishes for every tied participant', () => {
      const result = calculateBiggestSlugs(participants, [gameweek({ '1': 72, '2': 61, '3': 61 })]);

      expect(
        result.map(({ participantId, weeklyLosses }) => ({
          participantId,
          weeklyLosses,
        }))
      ).toEqual([
        { participantId: 2, weeklyLosses: 1 },
        { participantId: 3, weeklyLosses: 1 },
      ]);
    });

    it('omits participants with no last-place finishes', () => {
      expect(calculateBiggestSlugs(participants, [])).toEqual([]);
    });
  });

  it('uses participant order to break equal leaderboard totals', () => {
    const result = calculateSeasonLeaderboard(participants, [
      gameweek({ '1': 72, '2': 72, '3': 61 }),
    ]);

    expect(result.rows.map(({ participantId }) => participantId)).toEqual([1, 2, 3]);
    expect(result.lastPlaceParticipantIds).toEqual([3]);
  });

  it('returns all participants with zero wins for an empty season', () => {
    const result = calculateSeasonLeaderboard(participants, []);

    expect(result.rows).toEqual([
      { participantId: 1, totalWins: 0 },
      { participantId: 2, totalWins: 0 },
      { participantId: 3, totalWins: 0 },
    ]);
    expect(result.lastPlaceParticipantIds).toEqual([1, 2, 3]);
  });

  it('rejects duplicate participant IDs', () => {
    expect(() => calculateSeasonLeaderboard([participants[0], participants[0]], [])).toThrow(
      'Duplicate participant ID: 1'
    );
  });

  it('rejects duplicate and out-of-order Gameweeks', () => {
    expect(() =>
      calculateSeasonLeaderboard(participants, [
        gameweek({ '1': 72 }),
        { gameweek: 1, scores: createScores({ '1': 73 }) },
      ])
    ).toThrow('Duplicate Gameweek number: 1');

    expect(() =>
      calculateSeasonLeaderboard(participants, [
        { gameweek: 2, scores: createScores({ '1': 72 }) },
        { gameweek: 1, scores: createScores({ '1': 73 }) },
      ])
    ).toThrow('Gameweeks must be in ascending order');
  });

  it('rejects malformed season collections', () => {
    expect(() => calculateSeasonLeaderboard(null as unknown as Array<Participant>, [])).toThrow(
      'participants must be an array'
    );
    expect(() =>
      calculateSeasonLeaderboard(participants, null as unknown as Array<Gameweek>)
    ).toThrow('Gameweeks must be an array');
  });

  it('keeps mathematically equal fractional totals tied', () => {
    const fractionalParticipants = [
      ...participants,
      { id: 4, name: 'Daniel', teamName: 'Dazzle United' },
    ];
    const result = calculateSeasonLeaderboard(fractionalParticipants, [
      {
        gameweek: 1,
        scores: createScores({ '1': 10, '2': 10, '3': 0, '4': 0 }),
      },
      {
        gameweek: 2,
        scores: createScores({ '1': 0, '2': 10, '3': 10, '4': 10 }),
      },
      {
        gameweek: 3,
        scores: createScores({ '1': 10, '2': 0, '3': 10, '4': 0 }),
      },
      {
        gameweek: 4,
        scores: createScores({ '1': 10, '2': 0, '3': 0, '4': 10 }),
      },
    ]);

    expect(result.lastPlaceParticipantIds).toEqual([2, 3, 4]);
    expect(result.rows[0]?.totalWins).toBe(1.5);
  });
});

describe('calculatePlayerStats', () => {
  it('derives player scores, positions, tied extrema, and reused balances', () => {
    const result = calculatePlayerStats(participants, [
      {
        gameweek: 1,
        scores: createScores(
          { '1': 50, '2': 50, '3': 30 },
          { '1': 1 }
        ),
      },
      {
        gameweek: 2,
        scores: createScores(
          { '1': 70, '2': 60, '3': 70 },
          { '1': 2 }
        ),
      },
      { gameweek: 3, scores: createScores({ '1': 50, '2': 40, '3': 30 }) },
    ], 1);

    expect(result).toEqual({
      participant: participants[0],
      totalPoints: 170,
      averageWeeklyScore: 170 / 3,
      highestScore: 70,
      highestScoreGameweeks: [2],
      lowestScore: 50,
      lowestScoreGameweeks: [1, 3],
      averageLeaguePosition: 1,
      seasonBalancePennies: -3200,
      currentBalancePennies: 300,
      totalTransfers: 3,
    });
  });

  it('excludes missing player scores from score and position statistics', () => {
    const result = calculatePlayerStats(participants, [
      gameweek({ '1': 50, '2': 30, '3': 10 }),
      { gameweek: 2, scores: createScores({ '2': 70, '3': 60 }) },
    ], 1);

    expect(result?.totalPoints).toBe(50);
    expect(result?.averageWeeklyScore).toBe(50);
    expect(result?.averageLeaguePosition).toBe(1);
    expect(result?.totalTransfers).toBe(0);
  });

  it('returns no result for unknown players and known players without scores', () => {
    const gameweeks = [gameweek({ '2': 70, '3': 60 })];

    expect(calculatePlayerStats(participants, gameweeks, 1)).toBeUndefined();
    expect(calculatePlayerStats(participants, gameweeks, 99)).toBeUndefined();
  });

  it('gives a three-way tied player the shared competition position, not their array index', () => {
    const fourParticipants = [
      ...participants,
      { id: 4, name: 'Daniel', teamName: 'Dazzle United' },
    ];
    const result = calculatePlayerStats(
      fourParticipants,
      [{ gameweek: 1, scores: createScores({ '1': 72, '2': 72, '3': 72, '4': 50 }) }],
      3
    );

    expect(result?.averageLeaguePosition).toBe(1);
  });
});

describe('calculateTeamValue', () => {
  it('returns the combined squad value and bank for the latest Gameweek that has both', () => {
    const result = calculateTeamValue(participants, [
      {
        gameweek: 1,
        scores: {
          '1': { points: 50, transfers: 0, transferCost: 0, squadValue: 1000, bank: 5 },
          '2': { points: 40, transfers: 0, transferCost: 0 },
        },
      },
      {
        gameweek: 2,
        scores: {
          '1': { points: 60, transfers: 0, transferCost: 0, squadValue: 1015, bank: 8 },
          '2': { points: 45, transfers: 0, transferCost: 0 },
        },
      },
    ], 1);

    expect(result).toEqual({ available: true, teamValueTenthsOfMillion: 1023 });
  });

  it('falls back to an earlier Gameweek when the latest one lacks squad value or bank', () => {
    const result = calculateTeamValue(participants, [
      {
        gameweek: 1,
        scores: {
          '1': { points: 50, transfers: 0, transferCost: 0, squadValue: 1000, bank: 5 },
          '2': { points: 40, transfers: 0, transferCost: 0 },
        },
      },
      {
        gameweek: 2,
        scores: {
          '1': { points: 60, transfers: 0, transferCost: 0 },
          '2': { points: 45, transfers: 0, transferCost: 0 },
        },
      },
    ], 1);

    expect(result).toEqual({ available: true, teamValueTenthsOfMillion: 1005 });
  });

  it('returns unavailable when no recorded Gameweek has both squad value and bank', () => {
    const result = calculateTeamValue(
      participants,
      [gameweek({ '1': 50, '2': 40 })],
      1
    );

    expect(result).toEqual({ available: false });
  });

  it('returns unavailable for a participant with no recorded scores at all', () => {
    const result = calculateTeamValue(
      participants,
      [{ gameweek: 1, scores: { '2': { points: 40, transfers: 0, transferCost: 0 } } }],
      1
    );

    expect(result).toEqual({ available: false });
  });

  it('returns unavailable for an unknown participant', () => {
    const result = calculateTeamValue(
      participants,
      [
        {
          gameweek: 1,
          scores: {
            '1': { points: 50, transfers: 0, transferCost: 0, squadValue: 1000, bank: 5 },
          },
        },
      ],
      99
    );

    expect(result).toEqual({ available: false });
  });
});
