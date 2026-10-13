import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';
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
    assert.equal(typeof Reflect.get(module, `_${name}`), 'function');
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

test('native initialization rejects a corrupt SQLite image', async () => {
  await expect(
    createEngine(new Uint8Array([1, 2, 3]), factory),
  ).rejects.toThrow('initialization failed');
});

test('snapshots retain their state across subsequent writes and engine close', async () => {
  const bytes = new Uint8Array(
    await readFile(new URL('../../build/fixture.sqlite3', import.meta.url)),
  );
  const engine = await createEngine(bytes, factory);
  const read = {
    type: 'request',
    url: '/developer-settings',
    method: 'GET',
  } as const;
  let before: Uint8Array;
  let after: Uint8Array;
  let original: unknown;
  let updated: unknown;
  try {
    original = engine.dispatch(read).data;
    before = engine.snapshot();
    const retained = before.slice();
    engine.dispatch({
      type: 'request',
      url: '/developer-settings/isFreeHuntingPartiesEnabled',
      method: 'PATCH',
      body: { value: true },
    });
    updated = engine.dispatch(read).data;
    after = engine.snapshot();
    expect(before).toEqual(retained);
    expect(engine.snapshot()).toEqual(after);
  } finally {
    engine.close();
  }
  for (const [image, expected] of [
    [before!, original],
    [after!, updated],
  ] as const) {
    const reopened = await createEngine(image, factory);
    try {
      expect(reopened.dispatch(read).data).toEqual(expected);
    } finally {
      reopened.close();
    }
  }
});
