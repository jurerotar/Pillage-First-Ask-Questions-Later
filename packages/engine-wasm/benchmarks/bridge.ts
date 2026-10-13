import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Use node directly so this entry point works with npm on Windows and Unix.
const root = fileURLToPath(new URL('../', import.meta.url));
const child = spawn(
  process.execPath,
  [
    fileURLToPath(
      new URL('vitest.mjs', import.meta.resolve('vitest/package.json')),
    ),
    'run',
    '--config',
    fileURLToPath(new URL('../vitest.config.ts', import.meta.url)),
    '--project',
    'benchmarks',
    fileURLToPath(new URL('./__tests__/bridge.test.ts', import.meta.url)),
  ],
  {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, BRIDGE_BENCHMARK: '1' },
  },
);
child.on('error', (error) => {
  throw error;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
