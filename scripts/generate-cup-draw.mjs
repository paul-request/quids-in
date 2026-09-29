import { randomInt as secureRandomInt } from 'node:crypto';
import { access, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SEASON = '2026-27';
const MAX_SHUFFLE_ATTEMPTS = 1000;

export const QUIDS_IN_CUP = {
  id: 'quids-in-cup',
  name: 'Quids In Cup',
  revealAfterGameweek: 15,
  startGameweek: 16,
};

/**
 * Creates a random single-elimination Round 1 draw. Participants and byes
 * are shuffled into the smallest power-of-two bracket, rejecting any
 * arrangement that pairs two byes together.
 */
export function createCupDraw({
  cup = QUIDS_IN_CUP,
  generatedAt = new Date().toISOString(),
  participantIds,
  randomInt = secureRandomInt,
  season = DEFAULT_SEASON,
}) {
  if (!Array.isArray(participantIds) || participantIds.length < 2) {
    throw new Error('A cup draw needs at least two participants');
  }

  if (new Set(participantIds).size !== participantIds.length) {
    throw new Error('Cup draw participants must be unique');
  }

  let slotCount = 2;

  while (slotCount < participantIds.length) {
    slotCount *= 2;
  }

  const slots = [
    ...participantIds,
    ...Array.from({ length: slotCount - participantIds.length }, () => null),
  ];

  for (let attempt = 0; attempt < MAX_SHUFFLE_ATTEMPTS; attempt += 1) {
    const shuffled = shuffle(slots, randomInt);
    const round1Fixtures = [];

    for (let index = 0; index < shuffled.length; index += 2) {
      round1Fixtures.push({
        fixture: index / 2 + 1,
        participantIds: [shuffled[index], shuffled[index + 1]],
      });
    }

    if (round1Fixtures.every(({ participantIds: ids }) => ids.some((id) => id !== null))) {
      return {
        cups: [{ ...cup, round1Fixtures }],
        generatedAt,
        season,
      };
    }
  }

  throw new Error('Could not create a cup draw without a bye-vs-bye fixture');
}

export async function writeCupDraw(outputPath, draw, { force = false } = {}) {
  const resolvedOutputPath = resolve(outputPath);

  if (!force && (await fileExists(resolvedOutputPath))) {
    throw new Error(
      `A cup draw already exists at ${resolvedOutputPath}. Re-run with --force to replace it.`
    );
  }

  const temporaryPath = `${resolvedOutputPath}.tmp`;

  await writeFile(temporaryPath, `${JSON.stringify(draw, null, 2)}\n`);
  await rename(temporaryPath, resolvedOutputPath);
}

function shuffle(values, randomInt) {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);

    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

async function fileExists(path) {
  try {
    await access(path);

    return true;
  } catch {
    return false;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const force = process.argv.includes('--force');
  const seasonPath = `data/season-${DEFAULT_SEASON}.json`;
  const outputPath = `data/cup-draw-${DEFAULT_SEASON}.json`;

  try {
    const seasonData = JSON.parse(await readFile(seasonPath, 'utf8'));
    const draw = createCupDraw({
      participantIds: seasonData.participants.map(({ id }) => id),
      season: seasonData.season,
    });

    await writeCupDraw(outputPath, draw, { force });
    console.log(`Created the ${QUIDS_IN_CUP.name} draw in ${resolve(outputPath)}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
