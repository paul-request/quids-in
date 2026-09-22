import { mkdir, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const FPL_API_BASE_URL = 'https://fantasy.premierleague.com/api';
const DEFAULT_LEAGUE_ID = 869128;
const DEFAULT_SEASON = '2026-27';

export async function importSeasonData({
  fetchFn = globalThis.fetch,
  leagueId = DEFAULT_LEAGUE_ID,
  retrievedAt = new Date().toISOString(),
  season = DEFAULT_SEASON,
} = {}) {
  validatePositiveInteger(leagueId, 'League ID');
  validateNonEmptyString(season, 'Season');
  validateIsoDate(retrievedAt);

  const entries = await fetchLeagueEntries(fetchFn, leagueId);
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

  return {
    gameweeks: createGameweeks(histories),
    participants,
    season,
    source: {
      leagueId,
      retrievedAt,
    },
  };
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

    entries.push(...standings.results);
    hasNextPage = standings.has_next;
    page += 1;
  }

  if (entries.length === 0) {
    throw new Error(`League ${leagueId} has no standings entries`);
  }

  return entries;
}

async function fetchJson(fetchFn, path, description) {
  let response;

  try {
    response = await fetchFn(`${FPL_API_BASE_URL}${path}`);
  } catch (error) {
    throw new Error(
      `FPL request failed for ${description}: ${getErrorMessage(error)}`,
      { cause: error },
    );
  }

  if (!response?.ok) {
    throw new Error(
      `FPL request failed for ${description}: HTTP ${response?.status ?? 'unknown'}`,
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(
      `FPL returned invalid JSON for ${description}: ${getErrorMessage(error)}`,
      { cause: error },
    );
  }
}

function createParticipant(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Malformed standings entry');
  }

  validatePositiveInteger(entry.entry, 'FPL entry ID');
  validateNonEmptyString(entry.player_name, `Player name for entry ${entry.entry}`);
  validateNonEmptyString(entry.entry_name, `Team name for entry ${entry.entry}`);

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
    if (!history || typeof history !== 'object' || !Array.isArray(history.current)) {
      throw new Error(`Malformed history payload for entry ${participant.id}`);
    }

    const chipsByGameweek = createChipsByGameweek(history.chips, participant.id);
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

    validatePositiveInteger(chip.event, `Chip Gameweek for entry ${participantId}`);
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
    validateNonNegativeInteger(score.value, `Squad value for entry ${participantId}`);
  }

  if (score.bank !== undefined) {
    validateNonNegativeInteger(score.bank, `Bank for entry ${participantId}`);
  }
}

function validateSeasonData(seasonData) {
  if (!seasonData || typeof seasonData !== 'object') {
    throw new Error('Season data must be an object');
  }

  validateNonEmptyString(seasonData.season, 'Season');
  validatePositiveInteger(seasonData.source?.leagueId, 'Source league ID');
  validateIsoDate(seasonData.source?.retrievedAt);

  if (!Array.isArray(seasonData.participants) || seasonData.participants.length === 0) {
    throw new Error('Season data must contain participants');
  }

  if (!Array.isArray(seasonData.gameweeks) || seasonData.gameweeks.length === 0) {
    throw new Error('Season data must contain Gameweeks');
  }

  const participantIds = new Set();

  for (const participant of seasonData.participants) {
    if (!participant || typeof participant !== 'object') {
      throw new Error('Season data contains an invalid participant');
    }

    validatePositiveInteger(participant.id, 'Participant ID');
    validateNonEmptyString(participant.name, `Name for entry ${participant.id}`);
    validateNonEmptyString(participant.teamName, `Team name for entry ${participant.id}`);

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
    const seasonData = await importSeasonData();
    await writeSeasonSnapshot(outputPath, seasonData);
    console.log(`Imported season data into ${resolve(outputPath)}`);
  } catch (error) {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
  }
}
