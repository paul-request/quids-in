import type {
  PlannerData,
  PlannerPlayer,
  PlannerPosition,
  PlannerRow,
  PlannerTable,
  PlannerTeam,
  ProjectedCell,
  TransferSuggestion,
} from './planner.interfaces';

export const PLANNER_HORIZON = 5;

const GOAL_POINTS: Record<PlannerPosition, number> = { 1: 6, 2: 6, 3: 5, 4: 4 };
const CLEAN_SHEET_POINTS: Record<PlannerPosition, number> = { 1: 4, 2: 4, 3: 1, 4: 0 };
const BONUS_PER_90: Record<PlannerPosition, number> = { 1: 0.3, 2: 0.35, 3: 0.35, 4: 0.4 };
const ASSIST_POINTS = 3;
const DEFAULT_XGC_PER_90 = 1.3;
const FORM_WEIGHT = 0.5;
const FORM_RATIO_MAX = 1.6;
const POSITION_ORDER: Array<PlannerPosition> = [1, 2, 3, 4];

interface Averages {
  attack: number;
  defence: number;
}

function average(values: Array<number>): number {
  return values.length === 0
    ? 1
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function getAverages(teams: Array<PlannerTeam>): Averages {
  return {
    attack: average(teams.flatMap((team) => [team.strengthAttackHome, team.strengthAttackAway])),
    defence: average(teams.flatMap((team) => [team.strengthDefenceHome, team.strengthDefenceAway])),
  };
}

function getAvailability(player: PlannerPlayer): number {
  if (player.status === 'u' || player.status === 'n') {
    return 0;
  }

  return (player.chanceOfPlaying ?? 100) / 100;
}

/**
 * Expected points for one player in one fixture, built from xG, xA and xGC per
 * 90, the share of available minutes played, availability, and the
 * opponent's attack/defence strength at the relevant venue.
 */
export function projectFixture(
  player: PlannerPlayer,
  opponent: PlannerTeam,
  isHome: boolean,
  finishedGameweeks: number,
  averages: Averages
): number {
  const minutesShare =
    finishedGameweeks > 0 ? Math.min(1, player.minutes / (finishedGameweeks * 90)) : 0;
  const expectedMinutes = 90 * minutesShare * getAvailability(player);

  if (expectedMinutes <= 0) {
    return 0;
  }

  const fractionOfGame = expectedMinutes / 90;
  const opponentDefence = isHome ? opponent.strengthDefenceAway : opponent.strengthDefenceHome;
  const opponentAttack = isHome ? opponent.strengthAttackAway : opponent.strengthAttackHome;

  const expected = (attackingFactor: number, concedingFactor: number): number => {
    const appearance = 2 * Math.min(1, expectedMinutes / 60);
    const goals = player.xGPer90 * fractionOfGame * attackingFactor * GOAL_POINTS[player.position];
    const assists = player.xAPer90 * fractionOfGame * attackingFactor * ASSIST_POINTS;
    const expectedConceded =
      (player.xGCPer90 > 0 ? player.xGCPer90 : DEFAULT_XGC_PER_90) * concedingFactor;
    const cleanSheet =
      Math.exp(-expectedConceded) *
      Math.min(1, expectedMinutes / 60) *
      CLEAN_SHEET_POINTS[player.position];
    const concededPenalty = player.position <= 2 ? (expectedConceded / 2) * fractionOfGame : 0;
    const bonus = BONUS_PER_90[player.position] * fractionOfGame;

    return appearance + goals + assists + cleanSheet + bonus - concededPenalty;
  };

  const projected = expected(averages.defence / opponentDefence, opponentAttack / averages.attack);

  if (player.form === undefined) {
    return projected;
  }

  // Season-long xG/xA says what a player should score; recent form says whether
  // they are doing it. Scale the projection by how far form is from the
  // expectation against an average opponent, weighted by FORM_WEIGHT.
  const neutral = expected(1, 1);
  const formRatio = neutral > 0 ? Math.min(FORM_RATIO_MAX, player.form / neutral) : 1;

  return projected * (1 - FORM_WEIGHT + FORM_WEIGHT * formRatio);
}

function buildRow(
  player: PlannerPlayer,
  data: PlannerData,
  teamsById: Map<number, PlannerTeam>,
  averages: Averages
): PlannerRow {
  const team = teamsById.get(player.team);
  const cells: Array<ProjectedCell> = data.gameweeks.map((gameweek) => {
    const fixtures = data.fixtures.filter(
      (fixture) =>
        fixture.event === gameweek &&
        (fixture.homeTeam === player.team || fixture.awayTeam === player.team)
    );

    if (fixtures.length === 0) {
      return { fixtures: [], gameweek };
    }

    let points = 0;
    const projected = fixtures.map((fixture) => {
      const home = fixture.homeTeam === player.team;
      const opponent = teamsById.get(home ? fixture.awayTeam : fixture.homeTeam);

      if (opponent) {
        points += projectFixture(player, opponent, home, data.finishedGameweeks, averages);
      }

      return {
        difficulty: home ? fixture.homeDifficulty : fixture.awayDifficulty,
        home,
        opponent: opponent?.shortName ?? '?',
      };
    });

    return { fixtures: projected, gameweek, points };
  });

  return {
    cells,
    name: player.name,
    playerId: player.id,
    position: player.position,
    sum: cells.reduce((total, cell) => total + (cell.points ?? 0), 0),
    teamName: team?.shortName ?? '?',
  };
}

function buildRows(data: PlannerData): Array<PlannerRow> {
  const teamsById = new Map(data.teams.map((team) => [team.id, team]));
  const averages = getAverages(data.teams);

  return data.players.map((player) => buildRow(player, data, teamsById, averages));
}

export function buildPlannerTable(
  data: PlannerData,
  participantId: number
): PlannerTable | undefined {
  const picks = data.squads[String(participantId)];

  if (!picks || picks.length === 0) {
    return undefined;
  }

  const rowsById = new Map(buildRows(data).map((row) => [row.playerId, row]));
  const orderedPicks = [...picks].sort((a, b) => a.slot - b.slot);
  const rowsFor = (slots: Array<(typeof picks)[number]>): Array<PlannerRow> =>
    slots.flatMap((pick) => {
      const row = rowsById.get(pick.playerId);

      return row ? [row] : [];
    });
  const starters = rowsFor(orderedPicks.filter((pick) => pick.slot <= 11)).sort(
    (a, b) => a.position - b.position
  );
  const bench = rowsFor(orderedPicks.filter((pick) => pick.slot > 11));

  const bestCaptains = data.gameweeks.map((gameweek, index) => {
    let best: { name?: string; points: number } = { points: 0 };

    for (const row of starters) {
      const points = row.cells[index]?.points ?? 0;

      if (points > best.points) {
        best = { name: row.name, points };
      }
    }

    return { gameweek, ...best };
  });
  const xiTotals = data.gameweeks.map(
    (_, index) =>
      starters.reduce((total, row) => total + (row.cells[index]?.points ?? 0), 0) +
      (bestCaptains[index]?.points ?? 0)
  );

  return {
    bench,
    bestCaptains,
    gameweeks: data.gameweeks,
    starters,
    totalSum: xiTotals.reduce((total, value) => total + value, 0),
    xiTotals,
  };
}

export function suggestTransfers(
  data: PlannerData,
  participantId: number,
  perPosition = 3
): Array<TransferSuggestion> {
  const picks = data.squads[String(participantId)] ?? [];
  const owned = new Set(picks.map((pick) => pick.playerId));
  const rows = buildRows(data);
  const squadRows = rows.filter((row) => owned.has(row.playerId));

  return POSITION_ORDER.map((position) => {
    const replace = squadRows
      .filter((row) => row.position === position)
      .sort((a, b) => a.sum - b.sum)[0];
    const candidates = rows
      .filter((row) => row.position === position && !owned.has(row.playerId))
      .sort((a, b) => b.sum - a.sum)
      .slice(0, perPosition);

    return { candidates, position, replace };
  });
}
