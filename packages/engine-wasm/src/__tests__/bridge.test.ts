import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { createEngine } from '../../build/client.mjs';
import { bundleForHermes } from '../../scripts/bundle';

test('SQLite adapter and Hermes captures work in compiled Wasm', async () => {
  const root = fileURLToPath(new URL('../../../../', import.meta.url));
  const bundle = await bundleForHermes(
    path.join(
      root,
      'packages/engine-wasm/src/__tests__/fixtures/bridge-probe.ts',
    ),
  );
  await writeFile(
    path.join(root, 'packages/engine-wasm/build/modular/bridge-probe.js'),
    bundle,
  );
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'docker',
      [
        'run',
        '--rm',
        '--mount',
        'type=volume,source=pillage-wasm-toolchain,target=/toolchain',
        '--mount',
        `type=bind,source=${root},target=/workspace`,
        'emscripten/emsdk:6.0.12',
        'bash',
        '/workspace/packages/engine-wasm/scripts/__tests__/compile-bridge-probe.sh',
      ],
      { cwd: root, stdio: 'inherit' },
    );
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Probe build exited ${code}`)),
    );
  });
  const { default: factory } = await import('../../build/bridge-probe.mjs');
  const fixture = new Uint8Array(
    await readFile(new URL('../../build/fixture.sqlite3', import.meta.url)),
  );
  const engine = await createEngine(fixture, factory);
  try {
    expect(
      engine.dispatch({ type: 'request', url: '/server', method: 'GET' }).data,
    ).toEqual({ checks: 20244 });
  } finally {
    engine.close();
  }
});
