import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { test } from 'vitest';
import { createEngine } from '../../build/client.mjs';

test('bridge integration', async () => {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../..',
  );
  await build({
    entryPoints: [
      path.join(
        root,
        'packages/engine-wasm/src/__tests__/fixtures/bridge-probe.ts',
      ),
    ],
    outfile: path.join(
      root,
      'packages/engine-wasm/build/modular/bridge-probe.js',
    ),
    bundle: true,
    format: 'iife',
    platform: 'neutral',
    target: 'es2020',
  });
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
  const results = [];
  {
    const engine = await createEngine(fixture, async () => {
      const module = await factory();
      return module;
    });
    try {
      const response = engine.dispatch({
        type: 'request',
        url: '/server',
        method: 'GET',
      });
      assert.ok(
        response.data &&
          typeof response.data === 'object' &&
          'checks' in response.data,
      );
      assert.equal(response.data.checks, 20235);
      results.push({ checks: response.data.checks });
    } finally {
      engine.close();
    }
  }

  await writeFile(
    new URL('../../build/fusion-verification.json', import.meta.url),
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        results,
        scope:
          'Real adapter and native bridge compiled to Wasm; repeated/cleared bindings, scalar/target rows, Unicode, blob fallback, surrogate rejection, transaction rollback/recovery and 20000 allocated rows per mode.',
      },
      null,
      2,
    ),
  );
  process.stdout.write(`${JSON.stringify(results)} bridge checks passed\n`);
});
