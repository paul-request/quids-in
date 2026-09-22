import type {
  Gameweek,
  GameweekResult,
  Participant,
  BiggestSlugRow,
  AverageWeeklyPositionRow,
  SeasonBalanceRow,
  SeasonLeaderboard,
  GameweekStats,
  PlayerStats,
  TeamValue,
} from './results.interfaces';

interface ParticipantIndex {
  order: Map<number, number>;
  ids: Set<number>;
}

interface Fraction {
  numerator: number;
  denominator: number;
}

export function calculateGameweekResult(
  participants: Array<Participant>,
  gameweek: Gameweek
): GameweekResult {
  validateCollection(participants, 'participants');
  const participantIndex = createParticipantIndex(participants);
  validateGameweek(gameweek, participantIndex);

  const scores = participants.map((participant) => ({
    participantId: participant.id,
    score: Object.prototype.hasOwnProperty.call(gameweek.scores, String(participant.id))
      ? gameweek.scores[String(participant.id)].points
      : 0,
  }));
  const highestScore = Math.max(...scores.map(({ score }) => score));
  const lowestScore = Math.min(...scores.map(({ score }) => score));
  const winnerIds = scores
    .filter(({ score }) => score === highestScore)
    .map(({ participantId }) => participantId);
  const lastPlaceParticipantIds = scores
    .filter(({ score }) => score === lowestScore)
    .map(({ participantId }) => participantId);

  return {
    highestScore,
    winners: winnerIds.map((participantId) => ({
      participantId,
      winShare: 1 / winnerIds.length,
    })),
    lowestScore,
    lastPlaceParticipantIds,
  };
}

export function calculateSeasonLeaderboard(
  participants: Array<Participant>,
  gameweeks: Array<Gameweek>
): SeasonLeaderboard {
  validateCollection(participants, 'participants');
  validateCollection(gameweeks, 'Gameweeks');
  const participantIndex = createParticipantIndex(participants);
  validateGameweekOrder(gameweeks);
  const totalWins = new Map(participants.map(({ id }) => [id, createFraction(0, 1)]));

  for (const gameweek of gameweeks) {
    const result = calculateGameweekResult(participants, gameweek);

    for (const winner of result.winners) {
      totalWins.set(
        winner.participantId,
        addFractions(
          totalWins.get(winner.participantId) ?? createFraction(0, 1),
          createFraction(1, result.winners.length)
        )
      );
    }
  }

  const rows = participants
    .map(({ id }) => ({
      participantId: id,
      totalWins: fractionToNumber(totalWins.get(id) ?? createFraction(0, 1)),
    }))
    .sort(
      (left, right) =>
        compareFractions(
          totalWins.get(right.participantId) ?? createFraction(0, 1),
          totalWins.get(left.participantId) ?? createFraction(0, 1)
        ) ||
        (participantIndex.order.get(left.participantId) ?? 0) -
          (participantIndex.order.get(right.participantId) ?? 0)
    );
  const minimumWins = rows[rows.length - 1]?.participantId;

  return {
    rows,
    lastPlaceParticipantIds:
      minimumWins === undefined
        ? []
        : rows
            .filter(
              ({ participantId }) =>
                compareFractions(
                  totalWins.get(participantId) ?? createFraction(0, 1),
                  totalWins.get(minimumWins) ?? createFraction(0, 1)
                ) === 0
            )
            .map(({ participantId }) => participantId),
  };
}

export function calculateBiggestSlugs(
  participants: Array<Participant>,
  gameweeks: Array<Gameweek>
): Array<BiggestSlugRow> {
  validateCollection(participants, 'participants');
  validateCollection(gameweeks, 'Gameweeks');
  const participantIndex = createParticipantIndex(participants);
  validateGameweekOrder(gameweeks);
  const weeklyLosses = new Map(participants.map(({ id }) => [id, 0]));

  for (const gameweek of gameweeks) {
    const result = calculateGameweekResult(participants, gameweek);

    for (const participantId of result.lastPlaceParticipantIds) {
      weeklyLosses.set(participantId, (weeklyLosses.get(participantId) ?? 0) + 1);
    }
  }

  return participants
    .map(({ id }) => ({
      participantId: id,
      weeklyLosses: weeklyLosses.get(id) ?? 0,
    }))
    .filter(({ weeklyLosses }) => weeklyLosses > 0)
    .sort(
      (left, right) =>
        right.weeklyLosses - left.weeklyLosses ||
        (participantIndex.order.get(left.participantId) ?? 0) -
          (participantIndex.order.get(right.participantId) ?? 0)
    );
}

export function calculateAverageWeeklyPosition(
  participants: Array<Participant>,
  gameweeks: Array<Gameweek>
): Array<AverageWeeklyPositionRow> {
  validateCollection(participants, 'participants');
  validateCollection(gameweeks, 'Gameweeks');
  const participantIndex = createParticipantIndex(participants);
  validateGameweekOrder(gameweeks);
  const positionTotals = new Map(
    participants.map(({ id }) => [
      id,
      { positionTotal: 0, scoreTotal: 0, recordedGameweeks: 0, scoredGameweeks: 0 },
    ])
  );

  for (const gameweek of gameweeks) {
    validateGameweek(gameweek, participantIndex);
    const rankedScores = rankParticipantsByScore(participants, gameweek, participantIndex);

    rankedScores.forEach(({ participantId, position }) => {
      const positionTotal = positionTotals.get(participantId);

      if (positionTotal) {
        positionTotal.positionTotal += position;
        positionTotal.recordedGameweeks += 1;
      }
    });

    for (const participant of participants) {
      const score = gameweek.scores[String(participant.id)]?.points;
      const positionTotal = positionTotals.get(participant.id);

      if (score !== undefined && positionTotal) {
        positionTotal.scoreTotal += score;
        positionTotal.scoredGameweeks += 1;
      }
    }
  }

  return participants
    .map(({ id }) => {
      const positionTotal = positionTotals.get(id);

      return {
        participantId: id,
        averagePosition:
          positionTotal && positionTotal.recordedGameweeks > 0
            ? positionTotal.positionTotal / positionTotal.recordedGameweeks
            : 0,
        averageWeeklyScore:
          positionTotal && positionTotal.scoredGameweeks > 0
            ? positionTotal.scoreTotal / positionTotal.scoredGameweeks
            : undefined,
        recordedGameweeks: positionTotal?.recordedGameweeks ?? 0,
      };
    })
    .filter(({ recordedGameweeks }) => recordedGameweeks > 0)
    .sort(
      (left, right) =>
        left.averagePosition - right.averagePosition ||
        (participantIndex.order.get(left.participantId) ?? 0) -
          (participantIndex.order.get(right.participantId) ?? 0)
    )
    .map(({ participantId, averagePosition, averageWeeklyScore }) => ({
      participantId,
      averagePosition,
      averageWeeklyScore,
    }));
}

export function calculateSeasonBalances(
  participants: Array<Participant>,
  gameweeks: Array<Gameweek>
): Array<SeasonBalanceRow> {
  validateCollection(participants, 'participants');
  validateCollection(gameweeks, 'Gameweeks');
  const participantIndex = createParticipantIndex(participants);
  validateGameweekOrder(gameweeks);
  const grossWinningsPennies = new Map(participants.map(({ id }) => [id, 0]));
  const weeklyPotPennies = participants.length * 100;
  const recordedGameweekCount = gameweeks.length;

  for (const gameweek of gameweeks) {
    const result = calculateGameweekResult(participants, gameweek);
    const baseSharePennies = Math.floor(weeklyPotPennies / result.winners.length);
    const leftoverPennies = weeklyPotPennies % result.winners.length;

    result.winners.forEach(({ participantId }, winnerIndex) => {
      grossWinningsPennies.set(
        participantId,
        (grossWinningsPennies.get(participantId) ?? 0) +
          baseSharePennies +
          (winnerIndex < leftoverPennies ? 1 : 0)
      );
    });
  }

  return participants
    .map(({ id }) => {
      const grossWinnings = grossWinningsPennies.get(id) ?? 0;

      return {
        participantId: id,
        grossWinningsPennies: grossWinnings,
        netBalancePennies: grossWinnings - 3800,
        weeklyBalancePennies: grossWinnings - recordedGameweekCount * 100,
      };
    })
    .sort(
      (left, right) =>
        right.netBalancePennies - left.netBalancePennies ||
        (participantIndex.order.get(left.participantId) ?? 0) -
          (participantIndex.order.get(right.participantId) ?? 0)
    );
}

export function calculateGameweekStats(
  participants: Array<Participant>,
  gameweeks: Array<Gameweek>,
  selectedGameweek: Gameweek
): GameweekStats {
  validateCollection(participants, 'participants');
  validateCollection(gameweeks, 'Gameweeks');
  const participantIndex = createParticipantIndex(participants);
  validateGameweekOrder(gameweeks);

  const selectedGameweekInSeason = gameweeks.find(
    ({ gameweek }) => gameweek === selectedGameweek.gameweek
  );

  if (!selectedGameweekInSeason) {
    throw new Error('Selected Gameweek must belong to the recorded season');
  }

  const selectedScores = getUsableScores(selectedGameweekInSeason, participantIndex);
  if (selectedScores.length === 0) {
    return { available: false };
  }

  const seasonGameweekAverages = gameweeks
    .map((gameweek) => getUsableScores(gameweek, participantIndex))
    .filter((scores) => scores.length > 0)
    .map(calculateAverage);
  const highestScore = Math.max(...selectedScores);
  const lowestScore = Math.min(...selectedScores);
  const leagueAverage = calculateAverage(selectedScores);
  const seasonAverage =
    seasonGameweekAverages.length > 0 ? calculateAverage(seasonGameweekAverages) : leagueAverage;

  return {
    available: true,
    highestScore,
    leagueAverage,
    lowestScore,
    spread: highestScore - lowestScore,
    varianceFromSeasonAverage: leagueAverage - seasonAverage,
  };
}

export function calculatePlayerStats(
  participants: Array<Participant>,
  gameweeks: Array<Gameweek>,
  participantId: number
): PlayerStats | undefined {
  validateCollection(participants, 'participants');
  validateCollection(gameweeks, 'Gameweeks');
  const participantIndex = createParticipantIndex(participants);
  validateGameweekOrder(gameweeks);
  const participant = participants.find(({ id }) => id === participantId);

  if (!participant) {
    return undefined;
  }

  const recordedScores = gameweeks.flatMap((gameweek) => {
    validateGameweek(gameweek, participantIndex);
    const score = gameweek.scores[String(participantId)];

    if (!score) {
      return [];
    }

    return [{
      gameweek: gameweek.gameweek,
      points: score.points,
      transfers: score.transfers,
    }];
  });
  const balance = calculateSeasonBalances(participants, gameweeks).find(
    (row) => row.participantId === participantId
  );

  if (recordedScores.length === 0 || !balance) {
    return undefined;
  }

  const totalPoints = recordedScores.reduce((total, { points }) => total + points, 0);
  const totalTransfers = recordedScores.reduce(
    (total, { transfers }) => total + transfers,
    0
  );
  const highestScore = Math.max(...recordedScores.map(({ points }) => points));
  const lowestScore = Math.min(...recordedScores.map(({ points }) => points));
  const totalPosition = gameweeks.reduce((total, gameweek) => {
    if (!gameweek.scores[String(participantId)]) {
      return total;
    }

    return total + getCompetitionPosition(participants, gameweek, participantId, participantIndex);
  }, 0);

  return {
    averageLeaguePosition: totalPosition / recordedScores.length,
    averageWeeklyScore: totalPoints / recordedScores.length,
    highestScore,
    highestScoreGameweeks: recordedScores
      .filter(({ points }) => points === highestScore)
      .map(({ gameweek }) => gameweek),
    lowestScore,
    lowestScoreGameweeks: recordedScores
      .filter(({ points }) => points === lowestScore)
      .map(({ gameweek }) => gameweek),
    participant,
    seasonBalancePennies: balance.netBalancePennies,
    currentBalancePennies: balance.weeklyBalancePennies,
    totalTransfers,
    totalPoints,
  };
}

export function calculateTeamValue(
  participants: Array<Participant>,
  gameweeks: Array<Gameweek>,
  participantId: number
): TeamValue {
  validateCollection(participants, 'participants');
  validateCollection(gameweeks, 'Gameweeks');
  const participantIndex = createParticipantIndex(participants);
  validateGameweekOrder(gameweeks);

  const recordedTeamValues = gameweeks.flatMap((gameweek) => {
    validateGameweek(gameweek, participantIndex);
    const score = gameweek.scores[String(participantId)];

    if (!score || score.squadValue === undefined || score.bank === undefined) {
      return [];
    }

    return [score.squadValue + score.bank];
  });

  if (recordedTeamValues.length === 0) {
    return { available: false };
  }

  return {
    available: true,
    teamValueTenthsOfMillion: recordedTeamValues[recordedTeamValues.length - 1],
  };
}

function getUsableScores(
  gameweek: Gameweek,
  participantIndex: ParticipantIndex
): Array<number> {
  validateGameweek(gameweek, participantIndex, true);

  return Object.values(gameweek.scores).map(({ points }) => points);
}

function calculateAverage(values: Array<number>): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getCompetitionPosition(
  participants: Array<Participant>,
  gameweek: Gameweek,
  participantId: number,
  participantIndex: ParticipantIndex
): number {
  const rankedScores = rankParticipantsByScore(participants, gameweek, participantIndex);

  return rankedScores.find((entry) => entry.participantId === participantId)?.position ?? 0;
}

/**
 * Ranks participants by score for a single Gameweek using competition
 * ("1224") ranking: participants tied on score share the same position, and
 * the position after a tied group skips the places taken by the tie.
 */
function rankParticipantsByScore(
  participants: Array<Participant>,
  gameweek: Gameweek,
  participantIndex: ParticipantIndex
): Array<{ participantId: number; score: number; position: number }> {
  const sortedScores = participants
    .map((participant) => ({
      participantId: participant.id,
      score: gameweek.scores[String(participant.id)]?.points ?? 0,
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        (participantIndex.order.get(left.participantId) ?? 0) -
          (participantIndex.order.get(right.participantId) ?? 0)
    );
  let currentPosition = 0;

  return sortedScores.map((entry, index) => {
    if (index === 0 || entry.score !== sortedScores[index - 1].score) {
      currentPosition = index + 1;
    }

    return { ...entry, position: currentPosition };
  });
}

function createParticipantIndex(participants: Array<Participant>): ParticipantIndex {
  const ids = new Set<number>();
  const order = new Map<number, number>();

  participants.forEach((participant, index) => {
    if (!participant || typeof participant !== 'object') {
      throw new Error('Each participant must be an object');
    }

    if (!Number.isInteger(participant.id) || participant.id < 1) {
      throw new Error(`Invalid participant ID: ${participant.id}`);
    }

    if (ids.has(participant.id)) {
      throw new Error(`Duplicate participant ID: ${participant.id}`);
    }

    ids.add(participant.id);
    order.set(participant.id, index);
  });

  return { ids, order };
}

function validateGameweek(
  gameweek: Gameweek,
  participantIndex: ParticipantIndex,
  allowEmptyScores = false
): void {
  if (
    !gameweek ||
    typeof gameweek !== 'object' ||
    !gameweek.scores ||
    typeof gameweek.scores !== 'object' ||
    Array.isArray(gameweek.scores)
  ) {
    throw new Error('A Gameweek must contain a score map');
  }

  if (!Number.isInteger(gameweek.gameweek) || gameweek.gameweek < 1) {
    throw new Error(`Invalid Gameweek number: ${gameweek.gameweek}`);
  }

  const scoreEntries = Object.entries(gameweek.scores);
  if (scoreEntries.length === 0 && !allowEmptyScores) {
    throw new Error('A Gameweek must contain at least one score');
  }

  for (const [participantId, score] of scoreEntries) {
    const numericParticipantId = Number(participantId);

    if (
      String(numericParticipantId) !== participantId ||
      !Number.isInteger(numericParticipantId) ||
      !participantIndex.ids.has(numericParticipantId)
    ) {
      throw new Error(`Invalid participant ID in scores: ${participantId}`);
    }

    if (
      !score ||
      typeof score !== 'object' ||
      !Number.isFinite(score.points) ||
      !Number.isInteger(score.transfers) ||
      score.transfers < 0 ||
      !Number.isFinite(score.transferCost) ||
      score.transferCost < 0 ||
      (score.chip !== undefined && typeof score.chip !== 'string')
    ) {
      throw new Error(`Invalid score for participant ${participantId}`);
    }
  }
}

function validateCollection(value: unknown, name: string): void {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array`);
  }

  if (value.length === 0 && name === 'participants') {
    throw new Error('At least one participant is required');
  }
}

function validateGameweekOrder(gameweeks: Array<Gameweek>): void {
  const seenGameweeks = new Set<number>();
  let previousGameweek = 0;

  for (const gameweek of gameweeks) {
    if (
      !gameweek ||
      typeof gameweek !== 'object' ||
      !Number.isInteger(gameweek.gameweek) ||
      gameweek.gameweek < 1
    ) {
      throw new Error(`Invalid Gameweek number: ${gameweek?.gameweek}`);
    }

    if (seenGameweeks.has(gameweek.gameweek)) {
      throw new Error(`Duplicate Gameweek number: ${gameweek.gameweek}`);
    }

    if (gameweek.gameweek <= previousGameweek) {
      throw new Error('Gameweeks must be in ascending order');
    }

    seenGameweeks.add(gameweek.gameweek);
    previousGameweek = gameweek.gameweek;
  }
}

function createFraction(numerator: number, denominator: number): Fraction {
  const divisor = greatestCommonDivisor(numerator, denominator);

  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

function addFractions(left: Fraction, right: Fraction): Fraction {
  return createFraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator
  );
}

function compareFractions(left: Fraction, right: Fraction): number {
  return left.numerator * right.denominator - right.numerator * left.denominator;
}

function fractionToNumber(fraction: Fraction): number {
  return fraction.numerator / fraction.denominator;
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a || 1;
}
