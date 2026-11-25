import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchJson } from './import-season-data.mjs';

const DEFAULT_SEASON = '2026-27';
const PLANNER_HORIZON = 5;

export async function importPlannerData({
  fetchFn = globalThis.fetch,
  generatedAt = new Date().toISOString(),
  horizon = PLANNER_HORIZON,
  participantIds,
  season = DEFAULT_SEASON,
}) {
  if (
    !Array.isArray(participantIds) ||
    participantIds.some((id) => !Number.isInteger(id) || id < 1)
  ) {
    throw new Error('Participant IDs must be positive integers');
  }

  const bootstrap = await fetchJson(fetchFn, '/bootstrap-static/', 'planner players');

  if (
    !bootstrap ||
    !Array.isArray(bootstrap.elements) ||
    !Array.isArray(bootstrap.teams) ||
    !Array.isArray(bootstrap.events)
  ) {
    throw new Error('Malformed planner bootstrap payload');
  }

  const events = [...bootstrap.events].sort((a, b) => a.id - b.id);
  const upcoming = events.filter((event) => event.finished !== true).slice(0, horizon);
  const gameweeks = upcoming.map((event) => event.id);
  const finishedGameweeks = events.filter((event) => event.finished === true).length;
  const squadGameweek = (
    events.find((event) => event.is_current === true) ??
    [...events].reverse().find((event) => event.finished === true)
  )?.id;

  const [fixtures, squadEntries] = await Promise.all([
    fetchJson(fetchFn, '/fixtures/', 'planner fixtures'),
    Promise.all(
      squadGameweek === undefined
        ? []
        : participantIds.map(async (participantId) => [
            String(participantId),
            createPicks(
              await fetchJson(
                fetchFn,
                `/entry/${participantId}/event/${squadGameweek}/picks/`,
                `picks for entry ${participantId}`
              ),
              participantId
            ),
          ])
    ),
  ]);

  if (!Array.isArray(fixtures)) {
    throw new Error('Malformed planner fixtures payload');
  }

  const results = getTeamResults(fixtures);
  const leagueAverage =
    [...results.values()].reduce((total, team) => total + team.scored, 0) /
    Math.max(
      1,
      [...results.values()].reduce((total, team) => total + team.matches, 0)
    );
  const squads = Object.fromEntries(squadEntries);
  const ownedIds = new Set(
    Object.values(squads).flatMap((picks) => picks.map((pick) => pick.playerId))
  );

  const relevantElements = bootstrap.elements.filter(
    (element) => element.minutes > 0 || ownedIds.has(element.id)
  );
  const recentById = await fetchRecentMatches(fetchFn, relevantElements);

  return {
    finishedGameweeks,
    fixtures: fixtures.filter((fixture) => gameweeks.includes(fixture.event)).map(createFixture),
    gameweeks,
    generatedAt,
    players: relevantElements.map((element) => createPlayer(element, recentById.get(element.id))),
    season,
    squads,
    teams: bootstrap.teams.map((team) => createTeam(team, results.get(team.id), leagueAverage)),
  };
}

function requireNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Planner ${name} must be a finite number`);
  }

  return value;
}

function readPer90(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

const RECENT_MATCHES = 6;
const SUMMARY_BATCH_SIZE = 10;

async function fetchRecentMatches(fetchFn, elements) {
  const recentById = new Map();

  for (let start = 0; start < elements.length; start += SUMMARY_BATCH_SIZE) {
    await Promise.all(
      elements.slice(start, start + SUMMARY_BATCH_SIZE).map(async (element) => {
        const summary = await fetchJson(
          fetchFn,
          `/element-summary/${element.id}/`,
          `history for player ${element.id}`
        );

        if (!summary || !Array.isArray(summary.history)) {
          throw new Error(`Malformed history for player ${element.id}`);
        }

        recentById.set(
          element.id,
          summary.history.slice(-RECENT_MATCHES).map((match) => ({
            defensiveContribution: readPer90(match.defensive_contribution),
            minutes: requireNumber(match.minutes, 'match minutes'),
            saves: readPer90(match.saves),
            xA: readPer90(match.expected_assists),
            xG: readPer90(match.expected_goals),
            xGC: readPer90(match.expected_goals_conceded),
          }))
        );
      })
    );
  }

  return recentById;
}

function createPlayer(element, recent) {
  const position = requireNumber(element.element_type, 'player position');

  if (![1, 2, 3, 4].includes(position)) {
    throw new Error(`Planner player ${element.id} has an invalid position`);
  }

  return {
    chanceOfPlaying: element.chance_of_playing_next_round ?? null,
    form: readPer90(element.form),
    id: requireNumber(element.id, 'player ID'),
    minutes: requireNumber(element.minutes, 'player minutes'),
    name: String(element.web_name),
    pointsPerGame: readPer90(element.points_per_game),
    position,
    ...(recent && recent.length > 0 ? { recent } : {}),
    savesPer90: readPer90(element.saves_per_90),
    status: String(element.status),
    team: requireNumber(element.team, 'player team'),
    xAPer90: readPer90(element.expected_assists_per_90),
    xGCPer90: readPer90(element.expected_goals_conceded_per_90),
    xGPer90: readPer90(element.expected_goals_per_90),
  };
}

/**
 * FPL sometimes publishes zero attack/defence strengths while still providing
 * the 1-5 overall strengths. In that case, map the overall rating onto a
 * similar scale to FPL's usual 1000-1400 strengths so projections still vary
 * by opponent.
 */
function readStrength(value, overall) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  return 900 + requireNumber(overall, 'team overall strength') * 100;
}

const RESULTS_PRIOR_MATCHES = 6;
const BASE_STRENGTH = 1200;

/** Goals scored and conceded per team, from finished fixtures. */
function getTeamResults(fixtures) {
  const results = new Map();
  const add = (team, scored, conceded) => {
    const current = results.get(team) ?? { conceded: 0, matches: 0, scored: 0 };
    results.set(team, {
      conceded: current.conceded + conceded,
      matches: current.matches + 1,
      scored: current.scored + scored,
    });
  };

  for (const fixture of fixtures) {
    if (
      fixture.finished === true &&
      Number.isFinite(fixture.team_h_score) &&
      Number.isFinite(fixture.team_a_score)
    ) {
      add(fixture.team_h, fixture.team_h_score, fixture.team_a_score);
      add(fixture.team_a, fixture.team_a_score, fixture.team_h_score);
    }
  }

  return results;
}

/**
 * FPL's overall rating cannot tell a great defence from a great attack. When
 * the real attack/defence strengths are missing, blend the overall rating with
 * how many goals the team has actually scored and conceded, shrunk towards the
 * league average while the sample is small.
 */
function createStrengths(results, leagueAverage) {
  if (!results || results.matches === 0 || !(leagueAverage > 0)) {
    return undefined;
  }

  const shrink = (total) =>
    (total + RESULTS_PRIOR_MATCHES * leagueAverage) /
    (results.matches + RESULTS_PRIOR_MATCHES) /
    leagueAverage;

  return {
    attack: BASE_STRENGTH * shrink(results.scored),
    defence: BASE_STRENGTH / shrink(results.conceded),
  };
}

function createTeam(team, results, leagueAverage) {
  const overallHome = team.strength_overall_home;
  const overallAway = team.strength_overall_away;
  const goals = createStrengths(results, leagueAverage);
  const blend = (value, overall, fromGoals) => {
    const strength = readStrength(value, overall);

    return fromGoals !== undefined && !(typeof value === 'number' && value > 0)
      ? Math.round((strength + fromGoals) / 2)
      : strength;
  };

  return {
    id: requireNumber(team.id, 'team ID'),
    name: String(team.name),
    shortName: String(team.short_name),
    strengthAttackAway: blend(team.strength_attack_away, overallAway, goals?.attack),
    strengthAttackHome: blend(team.strength_attack_home, overallHome, goals?.attack),
    strengthDefenceAway: blend(team.strength_defence_away, overallAway, goals?.defence),
    strengthDefenceHome: blend(team.strength_defence_home, overallHome, goals?.defence),
  };
}

function createFixture(fixture) {
  return {
    awayDifficulty: requireNumber(fixture.team_a_difficulty, 'fixture difficulty'),
    awayTeam: requireNumber(fixture.team_a, 'fixture team'),
    event: requireNumber(fixture.event, 'fixture event'),
    homeDifficulty: requireNumber(fixture.team_h_difficulty, 'fixture difficulty'),
    homeTeam: requireNumber(fixture.team_h, 'fixture team'),
  };
}

function createPicks(response, participantId) {
  if (!response || !Array.isArray(response.picks)) {
    throw new Error(`Malformed picks for entry ${participantId}`);
  }

  return response.picks.map((pick) => ({
    playerId: requireNumber(pick.element, 'pick player'),
    slot: requireNumber(pick.position, 'pick position'),
  }));
}

async function writePlannerData(outputPath, plannerData) {
  const resolvedOutputPath = resolve(outputPath);
  const temporaryPath = `${resolvedOutputPath}.tmp`;

  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(plannerData)}\n`);
  await rename(temporaryPath, resolvedOutputPath);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputPath = process.argv[2] ?? `data/planner-${DEFAULT_SEASON}.json`;

  try {
    const season = JSON.parse(await readFile(`data/season-${DEFAULT_SEASON}.json`, 'utf8'));
    const plannerData = await importPlannerData({
      participantIds: season.participants.map((participant) => participant.id),
    });
    await writePlannerData(outputPath, plannerData);
    console.log(`Imported planner data into ${resolve(outputPath)}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
