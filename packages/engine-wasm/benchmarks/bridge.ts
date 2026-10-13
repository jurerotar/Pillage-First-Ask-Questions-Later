import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Use node directly so this entry point works with npm on Windows and Unix.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const child = spawn(
  process.execPath,
  [
    fileURLToPath(
      new URL('../../../node_modules/vitest/vitest.mjs', import.meta.url),
    ),
    'run',
    '--config',
    'packages/engine-wasm/vitest.config.ts',
    '--project',
    'benchmarks',
    'packages/engine-wasm/benchmarks/__tests__/bridge.test.ts',
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
