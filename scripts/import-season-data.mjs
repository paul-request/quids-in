import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const FPL_API_BASE_URL = 'https://fantasy.premierleague.com/api';
const DEFAULT_LEAGUE_ID = 869128;
const DEFAULT_SEASON = '2026-27';
const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 15000;

export async function importSeasonData({
  fetchFn = globalThis.fetch,
  leagueId = DEFAULT_LEAGUE_ID,
  retrievedAt = new Date().toISOString(),
  season = DEFAULT_SEASON,
  tieBreakGameweeks = [],
} = {}) {
  validatePositiveInteger(leagueId, 'League ID');
  validateNonEmptyString(season, 'Season');
  validateIsoDate(retrievedAt);

  const { cupLeagueId, entries } = await fetchLeagueEntries(fetchFn, leagueId);
  const participants = entries.map(createParticipant);
  const histories = await Promise.all(
    participants.map(async (participant) => ({
      history: await fetchJson(
        fetchFn,
        `/entry/${participant.id}/history/`,
        `history for entry ${participant.id}`,
      ),
      participant,
    })),
  );
  const endedGameweeks = await fetchEndedGameweeks(fetchFn);
  const gameweeks = createGameweeks(histories).map((gameweek) => {
    const fplAverage = endedGameweeks.get(gameweek.gameweek);

    return {
      ended: endedGameweeks.has(gameweek.gameweek),
      ...(fplAverage === undefined ? {} : { fplAverage }),
      ...gameweek,
    };
  });

  for (const gameweek of gameweeks) {
    if (tieBreakGameweeks.includes(gameweek.gameweek)) {
      await addTieBreakStats(fetchFn, gameweek, participants);
    }
  }

  const fplCup =
    cupLeagueId === null
      ? undefined
      : await fetchFplCup(fetchFn, cupLeagueId, participants);

  return {
    ...(fplCup ? { fplCup } : {}),
    gameweeks,
    participants,
    season,
    source: {
      leagueId,
      retrievedAt,
    },
  };
}

/**
 * Reads the Quids In Cup Gameweeks from the committed draw so the importer
 * only fetches tie-break data for the Gameweeks that need it.
 */
export async function loadTieBreakGameweeks(drawPath) {
  const drawFile = JSON.parse(await readFile(drawPath, 'utf8'));

  return drawFile.cups.flatMap(({ round1Fixtures, startGameweek }) => {
    const roundCount = Math.log2(round1Fixtures.length * 2);

    return Array.from(
      { length: roundCount },
      (_, index) => startGameweek + index,
    );
  });
}

async function fetchEndedGameweeks(fetchFn) {
  const bootstrap = await fetchJson(
    fetchFn,
    '/bootstrap-static/',
    'Gameweek status',
  );

  if (!bootstrap || !Array.isArray(bootstrap.events)) {
    throw new Error('Malformed Gameweek status payload');
  }

  return new Map(
    bootstrap.events
      .filter(
        (event) =>
          event && event.finished === true && event.data_checked === true,
      )
      .map((event) => [event.id, readFplAverage(event)]),
  );
}

/**
 * FPL's mean score across every team for a Gameweek. Returns undefined for a
 * missing or malformed value so it never fails the import.
 */
function readFplAverage(event) {
  const average = event.average_entry_score;

  return typeof average === 'number' &&
    Number.isFinite(average) &&
    average >= 0
    ? average
    : undefined;
}

/**
 * Adds FPL cup tie-break totals to each score: goals scored and goals
 * conceded by the players who counted towards the score after automatic
 * substitutions. Captaincy multipliers are deliberately ignored.
 */
async function addTieBreakStats(fetchFn, gameweek, participants) {
  const live = await fetchJson(
    fetchFn,
    `/event/${gameweek.gameweek}/live/`,
    `live stats for Gameweek ${gameweek.gameweek}`,
  );

  if (!live || !Array.isArray(live.elements)) {
    throw new Error(
      `Malformed live stats payload for Gameweek ${gameweek.gameweek}`,
    );
  }

  const statsByElement = new Map(
    live.elements.map((element) => [element.id, element.stats ?? {}]),
  );

  // Fetched in parallel (like histories) so a slow FPL API cannot push a
  // single import past the workflow timeout.
  const picksByParticipant = await Promise.all(
    participants.map((participant) =>
      fetchJson(
        fetchFn,
        `/entry/${participant.id}/event/${gameweek.gameweek}/picks/`,
        `picks for entry ${participant.id} in Gameweek ${gameweek.gameweek}`,
      ),
    ),
  );

  for (const [index, participant] of participants.entries()) {
    const picks = picksByParticipant[index];
    const countedElements = getCountedElements(
      picks,
      participant.id,
      gameweek.gameweek,
    );
    let goalsScored = 0;
    let goalsConceded = 0;

    for (const element of countedElements) {
      const stats = statsByElement.get(element);

      goalsScored += stats?.goals_scored ?? 0;
      goalsConceded += stats?.goals_conceded ?? 0;
    }

    validateNonNegativeInteger(
      goalsScored,
      `Goals scored for entry ${participant.id}`,
    );
    validateNonNegativeInteger(
      goalsConceded,
      `Goals conceded for entry ${participant.id}`,
    );
    gameweek.scores[participant.id] = {
      ...gameweek.scores[participant.id],
      goalsConceded,
      goalsScored,
    };
  }
}

function getCountedElements(picks, participantId, gameweekNumber) {
  if (!picks || !Array.isArray(picks.picks)) {
    throw new Error(
      `Malformed picks payload for entry ${participantId} in Gameweek ${gameweekNumber}`,
    );
  }

  const countedPositions = picks.active_chip === 'bboost' ? 15 : 11;
  const counted = new Set(
    picks.picks
      .filter((pick) => pick.position <= countedPositions)
      .map((pick) => pick.element),
  );

  for (const substitution of picks.automatic_subs ?? []) {
    counted.delete(substitution.element_out);
    counted.add(substitution.element_in);
  }

  return counted;
}

/**
 * Imports the official FPL League Cup once FPL has created it. Any failure
 * fails the whole import, so a deployment never replaces cup data with none;
 * the workflow retries and otherwise keeps the last good deployment.
 */
async function fetchFplCup(fetchFn, cupLeagueId, participants) {
  const participantIds = new Set(participants.map(({ id }) => id));
  const matchesById = new Map();
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await fetchJson(
      fetchFn,
      `/leagues-h2h-matches/league/${cupLeagueId}/?page=${page}`,
      `FPL League Cup matches page ${page}`,
    );

    if (
      !response ||
      !Array.isArray(response.results) ||
      typeof response.has_next !== 'boolean'
    ) {
      throw new Error(`Malformed FPL League Cup matches payload for page ${page}`);
    }

    for (const result of response.results) {
      const match = createFplCupMatch(result, participantIds);

      matchesById.set(match.id, match);
    }

    hasNextPage = response.has_next;
    page += 1;
  }

  return {
    cupLeagueId,
    matches: [...matchesById.values()].sort((left, right) => left.id - right.id),
  };
}

function createFplCupMatch(result, participantIds) {
  if (!result || typeof result !== 'object') {
    throw new Error('Malformed FPL League Cup match');
  }

  validatePositiveInteger(result.id, 'FPL League Cup match ID');
  validatePositiveInteger(
    result.event,
    `Gameweek for FPL League Cup match ${result.id}`,
  );

  const match = {
    entry1: result.entry_1_entry ?? null,
    entry1Points: result.entry_1_points ?? null,
    entry2: result.entry_2_entry ?? null,
    entry2Points: result.entry_2_points ?? null,
    gameweek: result.event,
    id: result.id,
    isBye: result.is_bye === true,
    ...(typeof result.knockout_name === 'string' && result.knockout_name !== ''
      ? { knockoutName: result.knockout_name }
      : {}),
    winner: result.winner ?? null,
  };

  validateFplCupMatch(match, participantIds);

  return match;
}

async function writeSeasonSnapshot(outputPath, seasonData) {
  validateNonEmptyString(outputPath, 'Output path');
  validateSeasonData(seasonData);

  const resolvedOutputPath = resolve(outputPath);
  const outputDirectory = dirname(resolvedOutputPath);
  const temporaryPath = `${resolvedOutputPath}.tmp`;

  await mkdir(outputDirectory, { recursive: true });

  try {
    await writeFile(temporaryPath, `${JSON.stringify(seasonData, null, 2)}\n`);
    await rename(temporaryPath, resolvedOutputPath);
  } catch (error) {
    throw new Error(
      `Could not write season snapshot to ${resolvedOutputPath}: ${getErrorMessage(error)}`,
      { cause: error },
    );
  }
}

async function fetchLeagueEntries(fetchFn, leagueId) {
  const entries = [];
  let cupLeagueId = null;
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await fetchJson(
      fetchFn,
      `/leagues-classic/${leagueId}/standings/?page_new_entries=1&page_standings=${page}`,
      `standings page ${page}`,
    );
    const standings = response?.standings;

    if (
      !standings ||
      typeof standings !== 'object' ||
      standings.page !== page ||
      !Array.isArray(standings.results) ||
      typeof standings.has_next !== 'boolean'
    ) {
      throw new Error(`Malformed standings payload for page ${page}`);
    }

    if (page === 1 && Number.isInteger(response.league?.cup_league)) {
      cupLeagueId = response.league.cup_league;
    }

    entries.push(...standings.results);
    hasNextPage = standings.has_next;
    page += 1;
  }

  if (entries.length === 0) {
    throw new Error(`League ${leagueId} has no standings entries`);
  }

  return { cupLeagueId, entries };
}

async function fetchJson(fetchFn, path, description) {
  let response;
  let lastError;

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      response = await fetchFn(`${FPL_API_BASE_URL}${path}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      lastError = new Error(
        `FPL request failed for ${description}: ${getErrorMessage(error)}`,
        {
          cause: error,
        },
      );
    }

    if (response?.ok) {
      break;
    }

    if (response && response.status >= 400 && response.status < 500) {
      throw new Error(
        `FPL request failed for ${description}: HTTP ${response.status}`,
      );
    }

    if (!lastError) {
      lastError = new Error(
        `FPL request failed for ${description}: HTTP ${response?.status ?? 'unknown'}`,
      );
    }

    if (attempt < FETCH_ATTEMPTS) {
      await new Promise((resolveRetry) =>
        setTimeout(resolveRetry, 2 ** (attempt - 1) * 500),
      );
    }
  }

  if (!response?.ok) {
    throw lastError;
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(
      `FPL returned invalid JSON for ${description}: ${getErrorMessage(error)}`,
      {
        cause: error,
      },
    );
  }
}

function createParticipant(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Malformed standings entry');
  }

  validatePositiveInteger(entry.entry, 'FPL entry ID');
  validateNonEmptyString(
    entry.player_name,
    `Player name for entry ${entry.entry}`,
  );
  validateNonEmptyString(
    entry.entry_name,
    `Team name for entry ${entry.entry}`,
  );

  return {
    id: entry.entry,
    name: entry.player_name,
    teamName: entry.entry_name,
  };
}

function createGameweeks(histories) {
  const historiesByParticipant = new Map();
  const gameweekNumbers = new Set();

  for (const { history, participant } of histories) {
    if (
      !history ||
      typeof history !== 'object' ||
      !Array.isArray(history.current)
    ) {
      throw new Error(`Malformed history payload for entry ${participant.id}`);
    }

    const chipsByGameweek = createChipsByGameweek(
      history.chips,
      participant.id,
    );
    const scoresByGameweek = new Map();

    for (const score of history.current) {
      validateHistoryScore(score, participant.id);

      if (scoresByGameweek.has(score.event)) {
        throw new Error(
          `Duplicate Gameweek ${score.event} for entry ${participant.id}`,
        );
      }

      const chip = chipsByGameweek.get(score.event);

      scoresByGameweek.set(score.event, {
        ...(chip ? { chip } : {}),
        points: calculateNetPoints(score.points, score.event_transfers_cost),
        ...(score.bank !== undefined ? { bank: score.bank } : {}),
        ...(score.value !== undefined ? { squadValue: score.value } : {}),
        transferCost: score.event_transfers_cost,
        transfers: score.event_transfers,
      });
      gameweekNumbers.add(score.event);
    }

    historiesByParticipant.set(participant.id, scoresByGameweek);
  }

  return [...gameweekNumbers]
    .sort((left, right) => left - right)
    .map((gameweek) => ({
      gameweek,
      scores: Object.fromEntries(
        [...historiesByParticipant.entries()].map(([participantId, scores]) => {
          const score = scores.get(gameweek);

          if (!score) {
            throw new Error(
              `Missing Gameweek ${gameweek} score for entry ${participantId}`,
            );
          }

          return [participantId, score];
        }),
      ),
    }));
}

function calculateNetPoints(points, transferCost) {
  return points - transferCost;
}

function createChipsByGameweek(chips, participantId) {
  if (chips === undefined) {
    return new Map();
  }

  if (!Array.isArray(chips)) {
    throw new Error(`Malformed chip history for entry ${participantId}`);
  }

  const chipsByGameweek = new Map();

  for (const chip of chips) {
    if (!chip || typeof chip !== 'object') {
      throw new Error(`Malformed chip history for entry ${participantId}`);
    }

    validatePositiveInteger(
      chip.event,
      `Chip Gameweek for entry ${participantId}`,
    );
    validateNonEmptyString(chip.name, `Chip name for entry ${participantId}`);

    if (chipsByGameweek.has(chip.event)) {
      throw new Error(
        `Multiple chips recorded for Gameweek ${chip.event} for entry ${participantId}`,
      );
    }

    chipsByGameweek.set(chip.event, chip.name);
  }

  return chipsByGameweek;
}

function validateHistoryScore(score, participantId) {
  if (!score || typeof score !== 'object') {
    throw new Error(`Malformed Gameweek score for entry ${participantId}`);
  }

  validatePositiveInteger(score.event, `Gameweek for entry ${participantId}`);
  validateFiniteNumber(score.points, `Points for entry ${participantId}`);
  validateNonNegativeInteger(
    score.event_transfers,
    `Transfers for entry ${participantId}`,
  );
  validateNonNegativeNumber(
    score.event_transfers_cost,
    `Transfer cost for entry ${participantId}`,
  );

  if (score.value !== undefined) {
    validateNonNegativeInteger(
      score.value,
      `Squad value for entry ${participantId}`,
    );
  }

  if (score.bank !== undefined) {
    validateNonNegativeInteger(score.bank, `Bank for entry ${participantId}`);
  }

  if (score.goalsScored !== undefined) {
    validateNonNegativeInteger(
      score.goalsScored,
      `Goals scored for entry ${participantId}`,
    );
  }

  if (score.goalsConceded !== undefined) {
    validateNonNegativeInteger(
      score.goalsConceded,
      `Goals conceded for entry ${participantId}`,
    );
  }
}

function validateFplCupMatch(match, participantIds) {
  for (const [value, name] of [
    [match.entry1, 'first entry'],
    [match.entry2, 'second entry'],
    [match.winner, 'winner'],
  ]) {
    if (value === null) {
      continue;
    }

    validatePositiveInteger(value, `FPL League Cup match ${match.id} ${name}`);

    if (!participantIds.has(value)) {
      throw new Error(
        `FPL League Cup match ${match.id} contains unknown entry ${value}`,
      );
    }
  }

  for (const [value, name] of [
    [match.entry1Points, 'first entry points'],
    [match.entry2Points, 'second entry points'],
  ]) {
    if (value !== null) {
      validateFiniteNumber(value, `FPL League Cup match ${match.id} ${name}`);
    }
  }

  if (match.entry1 === null && match.entry2 === null) {
    throw new Error(`FPL League Cup match ${match.id} has no entries`);
  }
}

function validateSeasonData(seasonData) {
  if (!seasonData || typeof seasonData !== 'object') {
    throw new Error('Season data must be an object');
  }

  validateNonEmptyString(seasonData.season, 'Season');
  validatePositiveInteger(seasonData.source?.leagueId, 'Source league ID');
  validateIsoDate(seasonData.source?.retrievedAt);

  if (
    !Array.isArray(seasonData.participants) ||
    seasonData.participants.length === 0
  ) {
    throw new Error('Season data must contain participants');
  }

  if (
    !Array.isArray(seasonData.gameweeks) ||
    seasonData.gameweeks.length === 0
  ) {
    throw new Error('Season data must contain Gameweeks');
  }

  const participantIds = new Set();

  for (const participant of seasonData.participants) {
    if (!participant || typeof participant !== 'object') {
      throw new Error('Season data contains an invalid participant');
    }

    validatePositiveInteger(participant.id, 'Participant ID');
    validateNonEmptyString(
      participant.name,
      `Name for entry ${participant.id}`,
    );
    validateNonEmptyString(
      participant.teamName,
      `Team name for entry ${participant.id}`,
    );

    if (participantIds.has(participant.id)) {
      throw new Error(`Duplicate participant ID: ${participant.id}`);
    }

    participantIds.add(participant.id);
  }

  let previousGameweek = 0;

  for (const gameweek of seasonData.gameweeks) {
    if (!gameweek || typeof gameweek !== 'object') {
      throw new Error('Season data contains an invalid Gameweek');
    }

    validatePositiveInteger(gameweek.gameweek, 'Gameweek number');

    if (gameweek.gameweek <= previousGameweek) {
      throw new Error('Gameweeks must be in ascending order');
    }

    previousGameweek = gameweek.gameweek;

    if (gameweek.ended !== undefined && typeof gameweek.ended !== 'boolean') {
      throw new Error(
        `Gameweek ${gameweek.gameweek} ended flag must be a boolean`,
      );
    }

    if (!gameweek.scores || typeof gameweek.scores !== 'object') {
      throw new Error(`Gameweek ${gameweek.gameweek} must contain scores`);
    }

    for (const participantId of participantIds) {
      const score = gameweek.scores[participantId];

      if (!score) {
        throw new Error(
          `Missing Gameweek ${gameweek.gameweek} score for entry ${participantId}`,
        );
      }

      validateHistoryScore(
        {
          ...score,
          event: gameweek.gameweek,
          event_transfers: score.transfers,
          event_transfers_cost: score.transferCost,
        },
        participantId,
      );
    }
  }

  validateFplCupData(seasonData.fplCup, participantIds);
}

function validateFplCupData(fplCup, participantIds) {
  if (fplCup === undefined) {
    return;
  }

  validatePositiveInteger(fplCup?.cupLeagueId, 'FPL League Cup league ID');

  if (!Array.isArray(fplCup.matches)) {
    throw new Error('FPL League Cup matches must be an array');
  }

  const matchIds = new Set();

  for (const match of fplCup.matches) {
    validatePositiveInteger(match?.id, 'FPL League Cup match ID');
    validatePositiveInteger(
      match.gameweek,
      `Gameweek for FPL League Cup match ${match.id}`,
    );

    if (matchIds.has(match.id)) {
      throw new Error(`Duplicate FPL League Cup match ID: ${match.id}`);
    }

    matchIds.add(match.id);
    validateFplCupMatch(match, participantIds);
  }
}

function validatePositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function validateNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
}

function validateFiniteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
}

function validateNonNegativeNumber(value, name) {
  validateFiniteNumber(value, name);

  if (value < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
}

function validateNonEmptyString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string`);
  }
}

function validateIsoDate(value) {
  validateNonEmptyString(value, 'Retrieved at');

  if (Number.isNaN(Date.parse(value))) {
    throw new Error('Retrieved at must be an ISO date');
  }
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputPath = process.argv[2] ?? `data/season-${DEFAULT_SEASON}.json`;

  try {
    const seasonData = await importSeasonData({
      tieBreakGameweeks: await loadTieBreakGameweeks(
        `data/cup-draw-${DEFAULT_SEASON}.json`,
      ),
    });
    await writeSeasonSnapshot(outputPath, seasonData);
    console.log(`Imported season data into ${resolve(outputPath)}`);
  } catch (error) {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
  }
}
