import type {
  CupBracket,
  CupDefinition,
  CupDraw,
  CupDrawFile,
  CupPrize,
  CupRound,
  CupSlot,
  CupTie,
  CupTieBreak,
} from './cups.interfaces';
import type {
  FplCupMatch,
  Gameweek,
  GameweekScore,
  Participant,
  Season,
} from './results.interfaces';

export const FPL_LEAGUE_CUP: CupDefinition = {
  id: 'fpl-league-cup',
  name: 'FPL League Cup',
  revealAfterGameweek: 34,
  startGameweek: 35,
};

const PLACEHOLDER_ROUND_1_FIXTURES = 8;

interface TieContext {
  cupId: string;
  gameweek: Gameweek | undefined;
  gameweekNumber: number;
  season: string;
}

interface TieDecision {
  tieBreak?: CupTieBreak;
  winnerParticipantId: number;
}

/**
 * Builds every cup shown for a season, in schedule order. The committed cup
 * draw file is the season's cup configuration: a season without one (such as
 * a historical season) has no cups, so its money is unchanged.
 */
export function buildSeasonCups(drawFile: CupDrawFile, season: Season): Array<CupBracket> {
  if (drawFile.season !== season.season) {
    return [];
  }

  return [
    ...drawFile.cups.map((draw) => buildQuidsInCupBracket(draw, season)),
    buildFplCupBracket(season),
  ].sort((left, right) => left.startGameweek - right.startGameweek);
}

export function buildQuidsInCupBracket(draw: CupDraw, season: Season): CupBracket {
  validateCupDraw(draw, season.participants);
  const roundCount = Math.log2(draw.round1Fixtures.length * 2);
  const rounds: Array<CupRound> = [];

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const gameweekNumber = draw.startGameweek + roundIndex;
    const context: TieContext = {
      cupId: draw.id,
      gameweek: season.gameweeks.find(({ gameweek }) => gameweek === gameweekNumber),
      gameweekNumber,
      season: season.season,
    };
    const tieSlots: Array<[CupSlot, CupSlot]> =
      roundIndex === 0
        ? draw.round1Fixtures.map(({ participantIds }) => [
            createDrawSlot(participantIds[0]),
            createDrawSlot(participantIds[1]),
          ])
        : pairTies(rounds[roundIndex - 1].ties).map(([left, right]) => [
            advanceFromTie(left),
            advanceFromTie(right),
          ]);

    rounds.push({
      gameweek: gameweekNumber,
      name: getRoundName(roundIndex, roundCount),
      ties: tieSlots.map((slots, tieIndex) =>
        resolveQuidsInCupTie(getTieLabel(roundIndex, roundCount, tieIndex), slots, context)
      ),
    });
  }

  return {
    championParticipantId: rounds[rounds.length - 1]?.ties[0]?.winnerParticipantId,
    drawAvailable: true,
    id: draw.id,
    name: draw.name,
    revealAfterGameweek: draw.revealAfterGameweek,
    revealed: isGameweekEnded(season, draw.revealAfterGameweek),
    rounds,
    startGameweek: draw.startGameweek,
  };
}

export function buildFplCupBracket(
  season: Season,
  definition: CupDefinition = FPL_LEAGUE_CUP
): CupBracket {
  const matches = season.fplCup?.matches ?? [];

  if (matches.length === 0) {
    return createUndrawnBracket(definition);
  }

  validateFplCupMatches(matches, season.participants);
  const matchesByGameweek = new Map<number, Array<FplCupMatch>>();

  for (const match of [...matches].sort((left, right) => left.id - right.id)) {
    matchesByGameweek.set(match.gameweek, [
      ...(matchesByGameweek.get(match.gameweek) ?? []),
      match,
    ]);
  }

  const startGameweek = Math.min(...matchesByGameweek.keys());
  const round1Matches = matchesByGameweek.get(startGameweek) ?? [];
  const roundCount = Math.max(1, Math.ceil(Math.log2(round1Matches.length * 2)));
  const rounds: Array<CupRound> = [];

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const gameweekNumber = startGameweek + roundIndex;
    const gameweek = season.gameweeks.find((entry) => entry.gameweek === gameweekNumber);
    const roundMatches = matchesByGameweek.get(gameweekNumber) ?? [];
    const ties =
      roundMatches.length > 0
        ? roundMatches.map((match, tieIndex) =>
            resolveFplCupTie(getTieLabel(roundIndex, roundCount, tieIndex), match, gameweek)
          )
        : pairTies(rounds[roundIndex - 1]?.ties ?? []).map(([left, right], tieIndex) => ({
            label: getTieLabel(roundIndex, roundCount, tieIndex),
            slots: [advanceFromTie(left), advanceFromTie(right)] as [CupSlot, CupSlot],
            status: 'scheduled' as const,
          }));

    rounds.push({
      gameweek: gameweekNumber,
      name: getRoundName(roundIndex, roundCount),
      ties,
    });
  }

  const revealAfterGameweek = startGameweek - 1;

  return {
    championParticipantId: rounds[rounds.length - 1]?.ties[0]?.winnerParticipantId,
    drawAvailable: true,
    id: definition.id,
    name: definition.name,
    revealAfterGameweek,
    revealed: isGameweekEnded(season, revealAfterGameweek),
    rounds,
    startGameweek,
  };
}

/**
 * Returns the bracket to display. Before the reveal Gameweek has ended, the
 * real Round 1 pairings are kept (so the page can show them blurred) but
 * marked as obfuscated, with no scores or results. Later rounds show
 * "Winner of" placeholders, except that a Round 1 bye winner is already
 * known, so it is carried into the next round (also obfuscated).
 */
export function applyCupReveal(bracket: CupBracket): CupBracket {
  if (bracket.revealed || !bracket.drawAvailable) {
    return bracket;
  }

  return {
    ...bracket,
    championParticipantId: undefined,
    rounds: bracket.rounds.map((round, roundIndex) => ({
      ...round,
      ties: round.ties.map((tie, tieIndex) => {
        if (roundIndex === 0) {
          return {
            label: tie.label,
            slots: tie.slots.map(obfuscateSlot) as [CupSlot, CupSlot],
            status: 'obfuscated',
          };
        }

        const previousTies = bracket.rounds[roundIndex - 1].ties;
        const feederSlot = (feeder: CupTie | undefined): CupSlot =>
          roundIndex === 1 &&
          feeder?.status === 'walkover' &&
          feeder.winnerParticipantId !== undefined
            ? { kind: 'participant', obfuscated: true, participantId: feeder.winnerParticipantId }
            : { kind: 'winner-of', tieLabel: feeder?.label ?? 'TBC' };

        return {
          label: tie.label,
          slots: [
            feederSlot(previousTies[tieIndex * 2]),
            feederSlot(previousTies[tieIndex * 2 + 1]),
          ],
          status: 'scheduled',
        };
      }),
    })),
  };
}

export function getCupPrizes(brackets: Array<CupBracket>): Array<CupPrize> {
  return brackets.map(({ championParticipantId, startGameweek }) => ({
    startGameweek,
    winnerParticipantId: championParticipantId,
  }));
}

/**
 * Deterministic "virtual coin toss" for a tie that is still level after
 * every other tie-break. The same inputs always produce the same winner, so
 * every build of the site agrees.
 */
export function cupCoinToss(
  season: string,
  cupId: string,
  gameweek: number,
  leftParticipantId: number,
  rightParticipantId: number
): number {
  const [lowerId, higherId] = [leftParticipantId, rightParticipantId].sort(
    (left, right) => left - right
  );
  const seed = `${season}|${cupId}|${gameweek}|${lowerId}|${higherId}`;
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash % 2 === 0 ? lowerId : higherId;
}

function resolveQuidsInCupTie(
  label: string,
  slots: [CupSlot, CupSlot],
  context: TieContext
): CupTie {
  const [left, right] = slots;

  if (left.kind === 'bye' || right.kind === 'bye') {
    const participant = left.kind === 'participant' ? left : right;

    return {
      label,
      slots,
      status: 'walkover',
      winnerParticipantId:
        participant.kind === 'participant' ? participant.participantId : undefined,
    };
  }

  if (left.kind !== 'participant' || right.kind !== 'participant' || !context.gameweek) {
    return { label, slots, status: 'scheduled' };
  }

  const leftScore = context.gameweek.scores[String(left.participantId)];
  const rightScore = context.gameweek.scores[String(right.participantId)];
  const scoredSlots: [CupSlot, CupSlot] = [
    { ...left, score: leftScore?.points },
    { ...right, score: rightScore?.points },
  ];

  if (!context.gameweek.ended) {
    return { label, slots: scoredSlots, status: 'provisional' };
  }

  const decision = decideQuidsInCupTie(
    left.participantId,
    leftScore,
    right.participantId,
    rightScore,
    context
  );

  return {
    label,
    slots: scoredSlots,
    status: 'decided',
    ...decision,
  };
}

function decideQuidsInCupTie(
  leftId: number,
  leftScore: GameweekScore | undefined,
  rightId: number,
  rightScore: GameweekScore | undefined,
  context: TieContext
): TieDecision {
  const coinToss = (): TieDecision => ({
    tieBreak: 'coin-toss',
    winnerParticipantId: cupCoinToss(
      context.season,
      context.cupId,
      context.gameweekNumber,
      leftId,
      rightId
    ),
  });

  if (!leftScore && !rightScore) {
    return coinToss();
  }

  if (!leftScore || !rightScore) {
    return { tieBreak: 'missing-score', winnerParticipantId: leftScore ? leftId : rightId };
  }

  if (leftScore.points !== rightScore.points) {
    return { winnerParticipantId: leftScore.points > rightScore.points ? leftId : rightId };
  }

  if (
    leftScore.goalsScored !== undefined &&
    rightScore.goalsScored !== undefined &&
    leftScore.goalsScored !== rightScore.goalsScored
  ) {
    return {
      tieBreak: 'goals-scored',
      winnerParticipantId: leftScore.goalsScored > rightScore.goalsScored ? leftId : rightId,
    };
  }

  if (
    leftScore.goalsConceded !== undefined &&
    rightScore.goalsConceded !== undefined &&
    leftScore.goalsConceded !== rightScore.goalsConceded
  ) {
    return {
      tieBreak: 'goals-conceded',
      winnerParticipantId: leftScore.goalsConceded < rightScore.goalsConceded ? leftId : rightId,
    };
  }

  return coinToss();
}

function resolveFplCupTie(
  label: string,
  match: FplCupMatch,
  gameweek: Gameweek | undefined
): CupTie {
  const includeScores = gameweek !== undefined;
  const slots: [CupSlot, CupSlot] = [
    createFplSlot(match.entry1, match.entry1Points, includeScores),
    createFplSlot(match.entry2, match.entry2Points, includeScores),
  ];

  if (match.isBye || match.entry1 === null || match.entry2 === null) {
    return {
      label,
      slots,
      status: 'walkover',
      winnerParticipantId: match.winner ?? match.entry1 ?? match.entry2 ?? undefined,
    };
  }

  if (match.winner !== null) {
    return { label, slots, status: 'decided', winnerParticipantId: match.winner };
  }

  return { label, slots, status: includeScores ? 'provisional' : 'scheduled' };
}

function createFplSlot(
  participantId: number | null,
  points: number | null,
  includeScore: boolean
): CupSlot {
  if (participantId === null) {
    return { kind: 'bye', obfuscated: false };
  }

  return {
    kind: 'participant',
    obfuscated: false,
    participantId,
    ...(includeScore && points !== null ? { score: points } : {}),
  };
}

function createUndrawnBracket(definition: CupDefinition): CupBracket {
  const roundCount = Math.log2(PLACEHOLDER_ROUND_1_FIXTURES * 2);
  const rounds: Array<CupRound> = [];

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const tieCount = PLACEHOLDER_ROUND_1_FIXTURES / 2 ** roundIndex;

    rounds.push({
      gameweek: definition.startGameweek + roundIndex,
      name: getRoundName(roundIndex, roundCount),
      ties: Array.from({ length: tieCount }, (_, tieIndex) => ({
        label: getTieLabel(roundIndex, roundCount, tieIndex),
        slots:
          roundIndex === 0
            ? [{ kind: 'to-be-drawn' }, { kind: 'to-be-drawn' }]
            : [
                { kind: 'winner-of', tieLabel: rounds[roundIndex - 1].ties[tieIndex * 2].label },
                {
                  kind: 'winner-of',
                  tieLabel: rounds[roundIndex - 1].ties[tieIndex * 2 + 1].label,
                },
              ],
        status: 'scheduled',
      })),
    });
  }

  return {
    drawAvailable: false,
    id: definition.id,
    name: definition.name,
    revealAfterGameweek: definition.revealAfterGameweek,
    revealed: false,
    rounds,
    startGameweek: definition.startGameweek,
  };
}

function createDrawSlot(participantId: number | null): CupSlot {
  return participantId === null
    ? { kind: 'bye', obfuscated: false }
    : { kind: 'participant', obfuscated: false, participantId };
}

function advanceFromTie(tie: CupTie | undefined): CupSlot {
  if (!tie) {
    return { kind: 'to-be-drawn' };
  }

  return tie.winnerParticipantId === undefined
    ? { kind: 'winner-of', tieLabel: tie.label }
    : { kind: 'participant', obfuscated: false, participantId: tie.winnerParticipantId };
}

function obfuscateSlot(slot: CupSlot): CupSlot {
  if (slot.kind === 'participant') {
    return { kind: 'participant', obfuscated: true, participantId: slot.participantId };
  }

  if (slot.kind === 'bye') {
    return { kind: 'bye', obfuscated: true };
  }

  return slot;
}

function pairTies(ties: Array<CupTie>): Array<[CupTie | undefined, CupTie | undefined]> {
  const pairs: Array<[CupTie | undefined, CupTie | undefined]> = [];

  for (let index = 0; index < ties.length; index += 2) {
    pairs.push([ties[index], ties[index + 1]]);
  }

  return pairs;
}

function getRoundName(roundIndex: number, roundCount: number): string {
  const roundsFromFinal = roundCount - 1 - roundIndex;

  if (roundsFromFinal === 0) {
    return 'Final';
  }

  if (roundsFromFinal === 1) {
    return 'Semi-final';
  }

  if (roundsFromFinal === 2) {
    return 'Quarter-final';
  }

  return `Round ${roundIndex + 1}`;
}

function getTieLabel(roundIndex: number, roundCount: number, tieIndex: number): string {
  if (roundIndex === 0 && roundCount > 1) {
    return `Fixture ${tieIndex + 1}`;
  }

  const roundName = getRoundName(roundIndex, roundCount);

  return roundName === 'Final' ? 'Final' : `${roundName} ${tieIndex + 1}`;
}

function isGameweekEnded(season: Season, gameweekNumber: number): boolean {
  return season.gameweeks.some(({ ended, gameweek }) => gameweek === gameweekNumber && ended);
}

function validateCupDraw(draw: CupDraw, participants: Array<Participant>): void {
  const participantIds = new Set(participants.map(({ id }) => id));
  const drawnIds = new Set<number>();
  const fixtureCount = draw.round1Fixtures.length;

  if (!Number.isInteger(draw.startGameweek) || draw.startGameweek < 1) {
    throw new Error(`Invalid start Gameweek for ${draw.name}`);
  }

  if (!Number.isInteger(draw.revealAfterGameweek) || draw.revealAfterGameweek < 0) {
    throw new Error(`Invalid reveal Gameweek for ${draw.name}`);
  }

  if (fixtureCount === 0 || !Number.isInteger(Math.log2(fixtureCount))) {
    throw new Error(`${draw.name} must have a power-of-two number of Round 1 fixtures`);
  }

  draw.round1Fixtures.forEach((fixture, index) => {
    if (fixture.fixture !== index + 1) {
      throw new Error(`${draw.name} fixtures must be numbered in order`);
    }

    if (fixture.participantIds.length !== 2) {
      throw new Error(`${draw.name} fixture ${fixture.fixture} must have two slots`);
    }

    if (fixture.participantIds.every((participantId) => participantId === null)) {
      throw new Error(`${draw.name} fixture ${fixture.fixture} cannot be two byes`);
    }

    for (const participantId of fixture.participantIds) {
      if (participantId === null) {
        continue;
      }

      if (!participantIds.has(participantId)) {
        throw new Error(`${draw.name} contains unknown participant ${participantId}`);
      }

      if (drawnIds.has(participantId)) {
        throw new Error(`${draw.name} contains participant ${participantId} more than once`);
      }

      drawnIds.add(participantId);
    }
  });
}

function validateFplCupMatches(
  matches: Array<FplCupMatch>,
  participants: Array<Participant>
): void {
  const participantIds = new Set(participants.map(({ id }) => id));

  for (const match of matches) {
    for (const entry of [match.entry1, match.entry2, match.winner]) {
      if (entry !== null && !participantIds.has(entry)) {
        throw new Error(`FPL League Cup match ${match.id} contains unknown entry ${entry}`);
      }
    }
  }
}
