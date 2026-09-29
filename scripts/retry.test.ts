import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const retryScript = resolve(__dirname, 'retry.sh');

let workDir: string;
let counterPath: string;

function flakyCommand(failuresBeforeSuccess: number): Array<string> {
  return [
    'bash',
    '-c',
    `count=$(( $(cat "${counterPath}" 2>/dev/null || echo 0) + 1 )); ` +
      `echo "$count" > "${counterPath}"; ` +
      `[ "$count" -gt ${failuresBeforeSuccess} ] || exit 7`,
  ];
}

function runRetry(args: Array<string>) {
  return spawnSync('bash', [retryScript, ...args], { encoding: 'utf8' });
}

async function attemptCount(): Promise<number> {
  return Number((await readFile(counterPath, 'utf8')).trim());
}

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'retry-test-'));
  counterPath = join(workDir, 'count');
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe('retry.sh', () => {
  it('succeeds on the first attempt without retrying', async () => {
    const result = runRetry(['3', '0', ...flakyCommand(0)]);

    expect(result.status).toBe(0);
    expect(await attemptCount()).toBe(1);
    expect(result.stdout).not.toContain('::warning::');
  });

  it('retries until the command succeeds', async () => {
    const result = runRetry(['3', '0', ...flakyCommand(2)]);

    expect(result.status).toBe(0);
    expect(await attemptCount()).toBe(3);
    expect(result.stdout).toContain('::warning::Attempt 1/3 failed (exit 7)');
    expect(result.stdout).toContain('::warning::Attempt 2/3 failed (exit 7)');
    expect(result.stdout).not.toContain('::error::');
  });

  it('fails with the last exit code after every attempt fails', async () => {
    const result = runRetry(['3', '0', ...flakyCommand(99)]);

    expect(result.status).toBe(7);
    expect(await attemptCount()).toBe(3);
    expect(result.stdout).toContain('::error::All 3 attempts failed (exit 7)');
  });

  it('rejects invalid arguments', () => {
    expect(runRetry(['0', '0', 'true']).status).toBe(2);
    expect(runRetry(['3', 'x', 'true']).status).toBe(2);
    expect(runRetry(['3']).status).toBe(2);
  });
});
