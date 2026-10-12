import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';
import { execute, open } from '../../build/baseline.mjs';
import { createEngine } from '../../build/client.mjs';
import factory from '../../build/engine.mjs';

test('controllers integration', async () => {
  const original = new Uint8Array(
    await readFile(new URL('../../build/fixture.sqlite3', import.meta.url)),
  );
  const baseline = await open(original);
  baseline.raw.exec("UPDATE servers SET name='Živjo 🐉 — café';");
  const bytes = baseline.database.serialize();
  let engine = await createEngine(bytes, factory);
  for (const [url, method = 'GET', body] of [
    ['/developer-settings'],
    ['/server'],
    ['/server?x=%FF&x=%E0%A4%A&flag=%GG&emoji=%F0%9F%90%89'],
    ['/server?x=\ud800&x=\udc00'],
    ['/villages/1/events'],
    [
      '/developer-settings/isFreeHuntingPartiesEnabled',
      'PATCH',
      { value: true },
    ],
  ] as const) {
    const request = {
      type: 'request' as const,
      url,
      method,
      body,
    };
    const expected = execute(baseline.database, request);
    assert.deepEqual(engine.dispatch(request).data, expected);
  }
  for (const request of [
    {
      type: 'request' as const,
      url: '/developer-settings/isFreeHuntingPartiesEnabled',
      method: 'PATCH',
      body: { value: 'true' },
    },
    {
      type: 'request' as const,
      url: '/developer-settings/isFreeHuntingPartiesEnabled',
      method: 'PATCH',
      body: { value: true, extra: 1 },
    },
    { type: 'request' as const, url: '/does-not-exist', method: 'GET' },
  ]) {
    assert.throws(() => execute(baseline.database, request));
    assert.throws(() => engine.dispatch({ ...request }));
  }
  assert.deepEqual(
    engine.dispatch({
      type: 'request' as const,
      url: '/developer-settings',
      method: 'GET',
    }).data,
    execute(baseline.database, {
      type: 'request' as const,
      url: '/developer-settings',
      method: 'GET',
    }),
  );
  const snapshot = engine.snapshot();
  engine.close();
  engine = await createEngine(snapshot, factory);
  assert.deepEqual(
    engine.dispatch({
      type: 'request' as const,
      url: '/server',
      method: 'GET',
    }).data,
    execute(baseline.database, {
      type: 'request' as const,
      url: '/server',
      method: 'GET',
    }),
  );
  assert.deepEqual(
    engine.dispatch({
      type: 'request' as const,
      url: '/developer-settings',
      method: 'GET',
    }).data,
    execute(baseline.database, {
      type: 'request' as const,
      url: '/developer-settings',
      method: 'GET',
    }),
  );
  engine.close();
  baseline.close();
});
