import type {
  PlannerData,
  PlannerMatch,
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
const BONUS_PER_90: Record<PlannerPosition, number> = { 1: 0.45, 2: 0.35, 3: 0.35, 4: 0.4 };
// Home sides score about 30% more than away sides, split across both teams.
const HOME_ADVANTAGE = 1.14;
const SAVES_PER_POINT = 3;
// League-average xG and xA per 90 by position. Rates are pulled towards these
// until a player has plenty of minutes, so a few chances don't make a
// defender look like a forward.
const XG_PRIOR_PER_90: Record<PlannerPosition, number> = { 1: 0, 2: 0.06, 3: 0.17, 4: 0.46 };
const XA_PRIOR_PER_90: Record<PlannerPosition, number> = { 1: 0, 2: 0.056, 3: 0.133, 4: 0.06 };
const ATTACKING_PRIOR_MINUTES = 300;
// Defenders earn 2 points for 10+ defensive contributions and midfielders for
// 12+. About 29% of defender and 14% of midfielder appearances reach it, used
// as the prior for each player's own rate.
const DEFENSIVE_CONTRIBUTION_POINTS = 2;
const DEFENSIVE_CONTRIBUTION_THRESHOLD: Partial<Record<PlannerPosition, number>> = { 2: 10, 3: 12 };
const DEFENSIVE_CONTRIBUTION_PRIOR: Partial<Record<PlannerPosition, number>> = { 2: 0.29, 3: 0.14 };
const DEFENSIVE_CONTRIBUTION_PRIOR_WEIGHT = 2;
const MIN_MINUTES_FOR_DEFENSIVE_CONTRIBUTION = 45;
const ASSIST_POINTS = 3;
const DEFAULT_XGC_PER_90 = 1.3;
const FORM_WEIGHT = 0.18;
const POINTS_PER_GAME_WEIGHT = 0.5;
const RECENT_DECAY = 0.85;
const RECENT_MINUTES_WEIGHT = 0.7;
const RECENT_RATE_WEIGHT = 0.5;
const MIN_RECENT_MINUTES_FOR_RATES = 180;
const FORM_RATIO_MAX = 1.6;
// A defender's points per game swings on a few goals, so trust it less.
const DEFENDER_FORM_RATIO_MAX = 1.25;
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

interface Profile {
  defensiveContributionChance: number;
  minutes: number;
  savesPer90: number;
  xAPer90: number;
  xGCPer90: number;
  xGPer90: number;
}

/**
 * Expected minutes and per-90 rates, blending the season with the player's
 * most recent matches (most recent weighted highest) so rotation, benching and
 * hot or cold spells feed through.
 */
function getProfile(player: PlannerPlayer, finishedGameweeks: number): Profile {
  const seasonMinutes =
    finishedGameweeks > 0 ? 90 * Math.min(1, player.minutes / (finishedGameweeks * 90)) : 0;
  const recent = player.recent ?? [];
  const prior = DEFENSIVE_CONTRIBUTION_PRIOR[player.position] ?? 0;
  const sampleShare = player.minutes / (player.minutes + ATTACKING_PRIOR_MINUTES);
  const shrink = (rate: number, leagueRate: number): number =>
    sampleShare * rate + (1 - sampleShare) * leagueRate;
  const threshold = DEFENSIVE_CONTRIBUTION_THRESHOLD[player.position] ?? Infinity;

  if (recent.length === 0) {
    return {
      defensiveContributionChance: prior,
      minutes: seasonMinutes,
      savesPer90: player.savesPer90 ?? 0,
      xAPer90: shrink(player.xAPer90, XA_PRIOR_PER_90[player.position]),
      xGCPer90: player.xGCPer90,
      xGPer90: shrink(player.xGPer90, XG_PRIOR_PER_90[player.position]),
    };
  }

  const weights = recent.map((_, index) => RECENT_DECAY ** (recent.length - 1 - index));
  const weighted = (pick: (match: PlannerMatch) => number): number =>
    recent.reduce((total, match, index) => total + pick(match) * (weights[index] ?? 0), 0);
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  const weightedMinutes = weighted((match) => match.minutes);
  const recentMinutes = weightedMinutes / totalWeight;
  const blendRate = (season: number, recentTotal: number): number =>
    weightedMinutes >= (MIN_RECENT_MINUTES_FOR_RATES * totalWeight) / recent.length
      ? (1 - RECENT_RATE_WEIGHT) * season +
        (RECENT_RATE_WEIGHT * recentTotal * 90) / weightedMinutes
      : season;

  const defenders = recent
    .map((match, index) => ({ match, weight: weights[index] ?? 0 }))
    .filter(
      ({ match }) =>
        match.minutes >= MIN_MINUTES_FOR_DEFENSIVE_CONTRIBUTION &&
        match.defensiveContribution !== undefined
    );
  const hitWeight = defenders.reduce(
    (total, { match, weight }) =>
      total + ((match.defensiveContribution ?? 0) >= threshold ? weight : 0),
    0
  );
  const sampleWeight = defenders.reduce((total, { weight }) => total + weight, 0);

  return {
    defensiveContributionChance:
      (hitWeight + prior * DEFENSIVE_CONTRIBUTION_PRIOR_WEIGHT) /
      (sampleWeight + DEFENSIVE_CONTRIBUTION_PRIOR_WEIGHT),
    savesPer90: blendRate(
      player.savesPer90 ?? 0,
      weighted((match) => match.saves ?? 0)
    ),
    minutes: RECENT_MINUTES_WEIGHT * recentMinutes + (1 - RECENT_MINUTES_WEIGHT) * seasonMinutes,
    xAPer90: shrink(
      blendRate(
        player.xAPer90,
        weighted((match) => match.xA)
      ),
      XA_PRIOR_PER_90[player.position]
    ),
    xGCPer90: blendRate(
      player.xGCPer90,
      weighted((match) => match.xGC)
    ),
    xGPer90: shrink(
      blendRate(
        player.xGPer90,
        weighted((match) => match.xG)
      ),
      XG_PRIOR_PER_90[player.position]
    ),
  };
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
  const profile = getProfile(player, finishedGameweeks);
  const expectedMinutes = profile.minutes * getAvailability(player);

  if (expectedMinutes <= 0) {
    return 0;
  }

  const fractionOfGame = expectedMinutes / 90;
  const opponentDefence = isHome ? opponent.strengthDefenceAway : opponent.strengthDefenceHome;
  const opponentAttack = isHome ? opponent.strengthAttackAway : opponent.strengthAttackHome;

  const expected = (attackingFactor: number, concedingFactor: number): number => {
    const appearance = 2 * Math.min(1, expectedMinutes / 60);
    const goals = profile.xGPer90 * fractionOfGame * attackingFactor * GOAL_POINTS[player.position];
    const assists = profile.xAPer90 * fractionOfGame * attackingFactor * ASSIST_POINTS;
    const expectedConceded =
      (profile.xGCPer90 > 0 ? profile.xGCPer90 : DEFAULT_XGC_PER_90) * concedingFactor;
    const cleanSheet =
      Math.exp(-expectedConceded) *
      Math.min(1, expectedMinutes / 60) *
      CLEAN_SHEET_POINTS[player.position];
    const concededPenalty = player.position <= 2 ? (expectedConceded / 2) * fractionOfGame : 0;
    const bonus = BONUS_PER_90[player.position] * fractionOfGame;
    const saves =
      player.position === 1
        ? (profile.savesPer90 * fractionOfGame * concedingFactor) / SAVES_PER_POINT
        : 0;
    const defensiveContribution =
      player.position === 2 || player.position === 3
        ? profile.defensiveContributionChance *
          Math.min(1, expectedMinutes / 60) *
          DEFENSIVE_CONTRIBUTION_POINTS
        : 0;

    return (
      appearance +
      goals +
      assists +
      cleanSheet +
      bonus +
      saves +
      defensiveContribution -
      concededPenalty
    );
  };

  const venue = isHome ? HOME_ADVANTAGE : 1 / HOME_ADVANTAGE;
  const projected = expected(
    (averages.defence / opponentDefence) * venue,
    opponentAttack / averages.attack / venue
  );

  // Season-long xG/xA says what a player should score; recent form and the
  // season's points per game say whether they actually do (elite finishers
  // beat their xG). Scale the projection by how far each is from the
  // expectation against an average opponent, weighted by its anchor weight.
  // Form can only lift a projection: a cold spell shouldn't drag an elite
  // player's underlying rate down.
  const neutral = expected(1, 1);
  const anchors = [
    { floor: 1, value: player.form, weight: FORM_WEIGHT },
    { floor: 0, value: player.pointsPerGame, weight: POINTS_PER_GAME_WEIGHT },
  ];
  const ratioMax = player.position <= 2 ? DEFENDER_FORM_RATIO_MAX : FORM_RATIO_MAX;
  const multiplier = anchors.reduce(
    (total, { floor, value, weight }) =>
      value === undefined || neutral <= 0
        ? total
        : total + weight * (Math.min(ratioMax, Math.max(floor, value / neutral)) - 1),
    1
  );

  return projected * multiplier;
}

// Defender and keeper points rest on a clean sheet, so they have a lower
// ceiling than a midfielder or forward with the same average. A captain's
// points are doubled, so rank them by upside rather than the mean alone.
const DEFENSIVE_CAPTAIN_DISCOUNT = 0.85;

function getCaptainScore(candidate: { points: number; position: PlannerPosition }): number {
  return candidate.position <= 2 ? candidate.points * DEFENSIVE_CAPTAIN_DISCOUNT : candidate.points;
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
    const ranked = starters
      .map((row) => ({
        name: row.name,
        points: row.cells[index]?.points ?? 0,
        position: row.position,
      }))
      .filter((candidate) => candidate.points > 0)
      .sort((a, b) => getCaptainScore(b) - getCaptainScore(a))
      .map(({ name, points }) => ({ name, points }));
    const [best, vice] = ranked;

    return { gameweek, points: best?.points ?? 0, name: best?.name, vice };
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
      .filter(
        (row) =>
          row.position === position &&
          !owned.has(row.playerId) &&
          (replace === undefined || row.sum > replace.sum)
      )
      .sort((a, b) => b.sum - a.sum)
      .slice(0, perPosition);

    return { candidates, position, replace };
  });
}
