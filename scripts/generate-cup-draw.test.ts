import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createCupDraw, writeCupDraw } from './generate-cup-draw.mjs';

const participantIds = Array.from({ length: 14 }, (_, index) => index + 1);

function sequenceRandom(values: Array<number>): (max: number) => number {
  let index = 0;

  return (max: number) => {
    const value = values[index % values.length] % max;
    index += 1;

    return value;
  };
}

describe('createCupDraw', () => {
  it('creates 8 fixtures with every participant once and exactly 2 byes', () => {
    const draw = createCupDraw({
      generatedAt: '2026-09-29T12:00:00.000Z',
      participantIds,
      randomInt: sequenceRandom([3, 7, 1, 11, 5, 2, 13, 0, 9]),
    });
    const [cup] = draw.cups;
    const slots = cup.round1Fixtures.flatMap(({ participantIds: ids }) => ids);

    expect(draw.season).toBe('2026-27');
    expect(cup).toMatchObject({
      id: 'quids-in-cup',
      name: 'Quids In Cup',
      revealAfterGameweek: 15,
      startGameweek: 16,
    });
    expect(cup.round1Fixtures.map(({ fixture }) => fixture)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(slots.filter((slot) => slot === null)).toHaveLength(2);
    expect(slots.filter((slot) => slot !== null).sort((a, b) => a - b)).toEqual(participantIds);
  });

  it('reshuffles rather than pairing two byes together', () => {
    // Swapping every slot with itself leaves both byes in the last fixture, so the
    // first attempt must be rejected and the draw reshuffled.
    let calls = 0;
    const draw = createCupDraw({
      participantIds,
      randomInt: (max: number) => {
        calls += 1;

        return calls <= 15 ? max - 1 : 0;
      },
    });

    expect(calls).toBeGreaterThan(15);

    for (const fixture of draw.cups[0].round1Fixtures) {
      expect(fixture.participantIds.some((id) => id !== null)).toBe(true);
    }
  });

  it('rejects a draw that can only pair byes together', () => {
    expect(() => createCupDraw({ participantIds, randomInt: (max) => max - 1 })).toThrow(
      'Could not create a cup draw without a bye-vs-bye fixture'
    );
  });

  it('rejects duplicate participants', () => {
    expect(() => createCupDraw({ participantIds: [1, 1, 2] })).toThrow(
      'Cup draw participants must be unique'
    );
  });
});

describe('writeCupDraw', () => {
  let directory: string | undefined;

  afterEach(async () => {
    if (directory) {
      await rm(directory, { force: true, recursive: true });
      directory = undefined;
    }
  });

  it('refuses to overwrite an existing draw unless forced', async () => {
    directory = await mkdtemp(join(tmpdir(), 'cup-draw-'));
    const outputPath = join(directory, 'draw.json');

    await writeFile(outputPath, '{"existing":true}\n');

    await expect(writeCupDraw(outputPath, { replaced: true })).rejects.toThrow(
      'Re-run with --force to replace it'
    );
    expect(await readFile(outputPath, 'utf8')).toBe('{"existing":true}\n');

    await writeCupDraw(outputPath, { replaced: true }, { force: true });
    expect(JSON.parse(await readFile(outputPath, 'utf8'))).toEqual({ replaced: true });
  });
});
