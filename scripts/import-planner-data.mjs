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
    gameweeks.length === 0 ? [] : fetchJson(fetchFn, '/fixtures/?future=1', 'planner fixtures'),
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

  const squads = Object.fromEntries(squadEntries);
  const ownedIds = new Set(
    Object.values(squads).flatMap((picks) => picks.map((pick) => pick.playerId))
  );

  return {
    finishedGameweeks,
    fixtures: fixtures.filter((fixture) => gameweeks.includes(fixture.event)).map(createFixture),
    gameweeks,
    generatedAt,
    players: bootstrap.elements
      .filter((element) => element.minutes > 0 || ownedIds.has(element.id))
      .map(createPlayer),
    season,
    squads,
    teams: bootstrap.teams.map(createTeam),
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

function createPlayer(element) {
  const position = requireNumber(element.element_type, 'player position');

  if (![1, 2, 3, 4].includes(position)) {
    throw new Error(`Planner player ${element.id} has an invalid position`);
  }

  return {
    chanceOfPlaying: element.chance_of_playing_next_round ?? null,
    id: requireNumber(element.id, 'player ID'),
    minutes: requireNumber(element.minutes, 'player minutes'),
    name: String(element.web_name),
    position,
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

function createTeam(team) {
  const overallHome = team.strength_overall_home;
  const overallAway = team.strength_overall_away;

  return {
    id: requireNumber(team.id, 'team ID'),
    name: String(team.name),
    shortName: String(team.short_name),
    strengthAttackAway: readStrength(team.strength_attack_away, overallAway),
    strengthAttackHome: readStrength(team.strength_attack_home, overallHome),
    strengthDefenceAway: readStrength(team.strength_defence_away, overallAway),
    strengthDefenceHome: readStrength(team.strength_defence_home, overallHome),
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
