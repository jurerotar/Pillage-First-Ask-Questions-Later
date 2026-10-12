import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

test.each(['--unexpected-option', '--benchmarks', '--native'])(
  'rejects unsupported build option %s before bundling or invoking Docker',
  (option) => {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL('../build.ts', import.meta.url)), option],
      { encoding: 'utf8', timeout: 10_000 },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`Unsupported build option: ${option}`);
  },
);
