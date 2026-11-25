import { describe, expect, it, vi } from 'vitest';

import { importPlannerData } from './import-planner-data.mjs';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function element(id: number, overrides: Record<string, unknown> = {}) {
  return {
    chance_of_playing_next_round: null,
    element_type: 4,
    expected_assists_per_90: '0.20',
    expected_goals_conceded_per_90: '1.10',
    expected_goals_per_90: '0.50',
    id,
    minutes: 900,
    status: 'a',
    team: 1,
    web_name: `P${id}`,
    ...overrides,
  };
}

const bootstrap = {
  elements: [element(1), element(2, { minutes: 0 }), element(3, { minutes: 0 })],
  events: [
    { finished: true, id: 1, is_current: false },
    { finished: false, id: 2, is_current: true },
    { finished: false, id: 3 },
    { finished: false, id: 4 },
  ],
  teams: [
    {
      id: 1,
      name: 'Arsenal',
      short_name: 'ARS',
      strength_attack_away: 0,
      strength_attack_home: 1300,
      strength_defence_away: 0,
      strength_defence_home: 1250,
      strength_overall_away: 5,
      strength_overall_home: 4,
    },
  ],
};

const fixtures = [
  { event: 2, team_a: 1, team_a_difficulty: 3, team_h: 1, team_h_difficulty: 3 },
  { event: 4, team_a: 1, team_a_difficulty: 2, team_h: 1, team_h_difficulty: 4 },
];

function fetchFn() {
  return vi.fn(async (url: string) => {
    if (url.includes('/bootstrap-static/')) return jsonResponse(bootstrap);
    if (url.includes('/fixtures/')) return jsonResponse(fixtures);
    if (url.includes('/element-summary/')) {
      return jsonResponse({
        history: Array.from({ length: 8 }, (_, index) => ({
          expected_assists: '0.10',
          expected_goals: '0.30',
          expected_goals_conceded: '1.00',
          minutes: index,
        })),
      });
    }

    if (url.includes('/entry/10/event/2/picks/')) {
      return jsonResponse({ picks: [{ element: 3, position: 1 }] });
    }

    return jsonResponse({}, 404);
  });
}

describe('importPlannerData', () => {
  it('rewards a team that concedes few goals when strengths are missing', async () => {
    const team = (id: number) => ({
      id,
      name: `Team ${id}`,
      short_name: `T${id}`,
      strength_overall_away: 3,
      strength_overall_home: 3,
    });
    const stub = vi.fn(async (url: string) => {
      if (url.includes('/bootstrap-static/')) {
        return jsonResponse({ ...bootstrap, teams: [team(1), team(2)] });
      }

      if (url.includes('/fixtures/')) {
        return jsonResponse([
          { event: 1, finished: true, team_a: 2, team_h: 1, team_a_score: 3, team_h_score: 0 },
          { event: 1, finished: true, team_a: 1, team_h: 2, team_a_score: 0, team_h_score: 1 },
        ]);
      }

      return jsonResponse({ history: [] });
    });
    const data = await importPlannerData({ fetchFn: stub, participantIds: [] });
    const [first, second] = data.teams;

    expect(first.strengthDefenceHome).toBeLessThan(second.strengthDefenceHome);
    expect(first.strengthAttackHome).toBeLessThan(second.strengthAttackHome);
  });

  it('imports upcoming Gameweeks, squads, and players who played or are owned', async () => {
    const data = await importPlannerData({
      fetchFn: fetchFn(),
      generatedAt: '2026-11-25T00:00:00.000Z',
      horizon: 2,
      participantIds: [10],
    });

    expect(data.gameweeks).toEqual([2, 3]);
    expect(data.finishedGameweeks).toBe(1);
    expect(data.fixtures).toHaveLength(1);
    expect(data.squads).toEqual({ '10': [{ playerId: 3, slot: 1 }] });
    expect(data.players.map((player: { id: number }) => player.id)).toEqual([1, 3]);
    expect(data.players[0].recent).toHaveLength(6);
    expect(data.players[0].recent[5]).toEqual({
      defensiveContribution: 0,
      minutes: 7,
      saves: 0,
      xA: 0.1,
      xG: 0.3,
      xGC: 1,
    });
    expect(data.players[0]).toMatchObject({
      form: 0,
      pointsPerGame: 0,
      xGPer90: 0.5,
      xAPer90: 0.2,
      xGCPer90: 1.1,
    });
  });

  it('falls back to overall strength when attack/defence strengths are zero', async () => {
    const data = await importPlannerData({ fetchFn: fetchFn(), participantIds: [10] });

    expect(data.teams[0]).toMatchObject({
      strengthAttackAway: 1400,
      strengthAttackHome: 1300,
      strengthDefenceAway: 1400,
      strengthDefenceHome: 1250,
    });
  });

  it('fails when a squad cannot be fetched', async () => {
    await expect(importPlannerData({ fetchFn: fetchFn(), participantIds: [11] })).rejects.toThrow(
      /picks for entry 11/
    );
  });

  it('rejects invalid participant IDs', async () => {
    await expect(importPlannerData({ fetchFn: fetchFn(), participantIds: [0] })).rejects.toThrow(
      /Participant IDs/
    );
  });
});
