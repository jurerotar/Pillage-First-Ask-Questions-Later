import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';
import { execute, open } from '../../build/baseline.mjs';
import { createEngine } from '../../build/client.mjs';
import factory from '../../build/engine.mjs';

test('build integration', async () => {
  const module = await factory();
  for (const name of [
    'engine_initialize',
    'engine_dispatch',
    'engine_close',
    'engine_snapshot',
    'engine_snapshot_size',
  ]) {
    assert.equal(typeof module[`_${name}`], 'function');
  }
  const bytes = new Uint8Array(
    await readFile(new URL('../../build/fixture.sqlite3', import.meta.url)),
  );
  const baseline = await open(bytes);
  const engine = await createEngine(bytes, async () => module);
  try {
    for (const url of [
      '/developer-settings',
      '/server',
      '/villages/1/events',
    ]) {
      const request = { type: 'request' as const, url, method: 'GET' };
      assert.deepEqual(
        engine.dispatch(request).data,
        execute(baseline.database, request),
      );
    }
    assert.ok(engine.snapshot().length > 0);
  } finally {
    engine.close();
    baseline.close();
  }
  assert.throws(
    () => engine.dispatch({ type: 'request', url: '/server', method: 'GET' }),
    /closed/,
  );
  engine.close();
});
