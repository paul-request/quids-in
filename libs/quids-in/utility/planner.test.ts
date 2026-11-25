import { describe, expect, it } from 'vitest';

import type { PlannerData, PlannerPlayer, PlannerTeam } from './planner.interfaces';
import { buildPlannerTable, projectFixture, suggestTransfers } from './planner';

function team(id: number, shortName: string, strength = 1200): PlannerTeam {
  return {
    id,
    name: shortName,
    shortName,
    strengthAttackAway: strength,
    strengthAttackHome: strength,
    strengthDefenceAway: strength,
    strengthDefenceHome: strength,
  };
}

function player(overrides: Partial<PlannerPlayer> & { id: number }): PlannerPlayer {
  return {
    chanceOfPlaying: null,
    minutes: 900,
    name: `P${overrides.id}`,
    position: 4,
    status: 'a',
    team: 1,
    xAPer90: 0.2,
    xGCPer90: 1,
    xGPer90: 0.5,
    ...overrides,
  };
}

const averages = { attack: 1200, defence: 1200 };
const opponent = team(2, 'OPP');

describe('projectFixture', () => {
  const forward = player({ id: 1 });

  it('scales with opponent defence strength', () => {
    const easy = projectFixture(forward, team(2, 'EAS', 1000), true, 10, averages);
    const hard = projectFixture(forward, team(2, 'HRD', 1400), true, 10, averages);

    expect(easy).toBeGreaterThan(hard);
  });

  it('awards clean-sheet points to defenders but not forwards', () => {
    const defender = player({ id: 2, position: 2, xGPer90: 0, xAPer90: 0 });
    const striker = player({ id: 3, position: 4, xGPer90: 0, xAPer90: 0 });

    expect(projectFixture(defender, opponent, true, 10, averages)).toBeGreaterThan(
      projectFixture(striker, opponent, true, 10, averages)
    );
  });

  it('reduces projections for doubtful players and zeroes unavailable ones', () => {
    const full = projectFixture(forward, opponent, true, 10, averages);
    const doubtful = projectFixture(
      player({ id: 1, chanceOfPlaying: 50 }),
      opponent,
      true,
      10,
      averages
    );
    const injured = projectFixture(
      player({ id: 1, status: 'u', chanceOfPlaying: 0 }),
      opponent,
      true,
      10,
      averages
    );

    expect(doubtful).toBeLessThan(full);
    expect(injured).toBe(0);
  });

  it('projects more points at home than away', () => {
    expect(projectFixture(forward, opponent, true, 10, averages)).toBeGreaterThan(
      projectFixture(forward, opponent, false, 10, averages)
    );
  });

  it('anchors projections towards season points per game', () => {
    const baseline = projectFixture(forward, opponent, true, 10, averages);
    const elite = projectFixture(player({ id: 1, pointsPerGame: 9 }), opponent, true, 10, averages);

    expect(elite).toBeGreaterThan(baseline);
  });

  it('lowers projections for players in poor recent form and raises them for hot form', () => {
    const baseline = projectFixture(forward, opponent, true, 10, averages);
    const cold = projectFixture(player({ id: 1, form: 1 }), opponent, true, 10, averages);
    const hot = projectFixture(player({ id: 1, form: 9 }), opponent, true, 10, averages);

    expect(cold).toBeLessThan(baseline);
    expect(hot).toBeGreaterThan(baseline);
    expect(cold).toBeGreaterThan(0);
  });

  it('lowers projections for recently benched players and raises them for recent hot streaks', () => {
    const match = (minutes: number, xG: number) => ({ minutes, xA: 0.2, xG, xGC: 1 });
    const base = projectFixture(
      player({ id: 1, recent: Array.from({ length: 6 }, () => match(90, 0.5)) }),
      opponent,
      true,
      10,
      averages
    );
    const benched = projectFixture(
      player({
        id: 1,
        recent: [
          match(90, 0.5),
          match(90, 0.5),
          match(0, 0),
          match(0, 0),
          match(0, 0),
          match(0, 0),
        ],
      }),
      opponent,
      true,
      10,
      averages
    );
    const hot = projectFixture(
      player({ id: 1, recent: Array.from({ length: 6 }, () => match(90, 1.2)) }),
      opponent,
      true,
      10,
      averages
    );

    expect(benched).toBeLessThan(base);
    expect(hot).toBeGreaterThan(base);
  });

  it('rewards goalkeepers for saves and defenders for frequent defensive contributions', () => {
    const match = (saves: number, defensiveContribution: number) => ({
      defensiveContribution,
      minutes: 90,
      saves,
      xA: 0,
      xG: 0,
      xGC: 1,
    });
    const recent = (saves: number, dc: number) => Array.from({ length: 6 }, () => match(saves, dc));
    const keeper = (saves: number) =>
      projectFixture(
        player({
          id: 1,
          position: 1,
          recent: recent(saves, 0),
          savesPer90: saves,
          xAPer90: 0,
          xGPer90: 0,
        }),
        opponent,
        true,
        10,
        averages
      );
    const defender = (dc: number) =>
      projectFixture(
        player({ id: 2, position: 2, recent: recent(0, dc), xAPer90: 0, xGPer90: 0 }),
        opponent,
        true,
        10,
        averages
      );

    expect(keeper(5)).toBeGreaterThan(keeper(1));
    expect(defender(12)).toBeGreaterThan(defender(3));
    const midfielder = (dc: number) =>
      projectFixture(
        player({ id: 3, position: 3, recent: recent(0, dc), xAPer90: 0, xGPer90: 0 }),
        opponent,
        true,
        10,
        averages
      );

    expect(midfielder(14)).toBeGreaterThan(midfielder(4));
  });

  it('projects nothing for players with no minutes', () => {
    expect(projectFixture(player({ id: 1, minutes: 0 }), opponent, true, 10, averages)).toBe(0);
  });

  it('gives a sensible range for a regular starter', () => {
    const points = projectFixture(forward, opponent, true, 10, averages);

    expect(points).toBeGreaterThan(3);
    expect(points).toBeLessThan(9);
  });
});

function plannerData(): PlannerData {
  const picks = [
    { playerId: 1, slot: 1 },
    { playerId: 2, slot: 2 },
    { playerId: 3, slot: 12 },
  ];

  return {
    finishedGameweeks: 10,
    fixtures: [
      { awayDifficulty: 3, awayTeam: 2, event: 11, homeDifficulty: 3, homeTeam: 1 },
      { awayDifficulty: 3, awayTeam: 1, event: 12, homeDifficulty: 3, homeTeam: 2 },
      { awayDifficulty: 3, awayTeam: 2, event: 12, homeDifficulty: 3, homeTeam: 1 },
    ],
    gameweeks: [11, 12, 13],
    generatedAt: '2026-11-25T00:00:00.000Z',
    players: [
      player({ id: 1, position: 1, xGPer90: 0, xAPer90: 0 }),
      player({ id: 2, position: 4 }),
      player({ id: 3, position: 4, xGPer90: 0.1 }),
      player({ id: 4, position: 4, xGPer90: 0.9 }),
    ],
    season: '2026-27',
    squads: { '10': picks },
    teams: [team(1, 'HOM'), team(2, 'OPP')],
  };
}

describe('buildPlannerTable', () => {
  const data = plannerData();
  const table = buildPlannerTable(data, 10);

  it('returns undefined for an unknown participant', () => {
    expect(buildPlannerTable(data, 99)).toBeUndefined();
  });

  it('separates the XI from the bench and sorts the XI by position', () => {
    expect(table?.starters.map((row) => row.playerId)).toEqual([1, 2]);
    expect(table?.bench.map((row) => row.playerId)).toEqual([3]);
  });

  it('sums double Gameweeks and leaves blanks empty', () => {
    const cells = table?.starters[1]?.cells;

    expect(cells?.[0]?.fixtures).toHaveLength(1);
    expect(cells?.[1]?.fixtures).toHaveLength(2);
    expect(cells?.[1]?.points).toBeGreaterThan(cells?.[0]?.points ?? 0);
    expect(cells?.[2]?.points).toBeUndefined();
  });

  it('picks the best captain by projected points and doubles them in the XI total', () => {
    const forward = table?.starters[1];

    expect(table?.bestCaptains[0]).toMatchObject({ name: 'P2', points: forward?.cells[0]?.points });
    expect(table?.xiTotals[0]).toBeCloseTo(
      (table?.starters[0]?.cells[0]?.points ?? 0) + 2 * (forward?.cells[0]?.points ?? 0)
    );
    expect(table?.bestCaptains[0]?.vice).toMatchObject({ name: 'P1' });
    expect(table?.bestCaptains[2]?.name).toBeUndefined();
    expect(table?.totalSum).toBeCloseTo(table?.xiTotals.reduce((a, b) => a + b, 0) ?? 0);
  });
});

describe('suggestTransfers', () => {
  it('suggests the best unowned players and the weakest owned player to replace', () => {
    const forwards = suggestTransfers(plannerData(), 10).find((entry) => entry.position === 4);

    expect(forwards?.candidates[0]?.playerId).toBe(4);
    expect(forwards?.candidates.map((row) => row.playerId)).not.toContain(2);
    expect(forwards?.replace?.playerId).toBe(3);
  });
});
