import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';
import { execute, inspect, open } from '../../build/baseline.mjs';
import { createEngine } from '../../build/client.mjs';
import hermes from '../../build/engine.mjs';

test.each([
  'mixedVillagesEffects',
  'partial',
  'customTrigger',
  'rollback',
  'notifications',
])('scheduler: %s', async (scenario) => {
  const fixture = new Uint8Array(
    await readFile(new URL('../../build/fixture.sqlite3', import.meta.url)),
  );
  const normalize = (state: unknown) => ({
    ...(state as Record<string, unknown>),
    trainingHistory: (
      state as { trainingHistory: Record<string, unknown>[] }
    ).trainingHistory.map(({ timestamp, ...row }) => row),
  });
  const seed = await open(fixture);
  seed.raw.exec(
    'UPDATE resource_sites SET updated_at=1700000000000,wood=20,clay=20,iron=20,wheat=20',
  );
  if (scenario === 'mixedVillagesEffects') {
    const villages = seed.raw.selectValues(
      'SELECT id FROM villages ORDER BY id LIMIT 3',
    );
    const units = ['PHALANX', 'LEGIONNAIRE', 'IMPERIAN'];
    const update = seed.raw.prepare(
      "UPDATE events SET village_id=?1,meta=json_set(meta,'$.unitId',?2) WHERE id=?3",
    );
    for (const [i, id] of seed.raw
      .selectValues('SELECT id FROM events ORDER BY id')
      .entries()) {
      update.bind([villages[i % 3], units[i % 3], id]).stepReset();
    }
    update.finalize();
    const tile = seed.raw.selectValue(
      'SELECT tile_id FROM villages WHERE id=1',
    );
    const insert = seed.raw.prepare(
      'INSERT INTO effects(effect_id,value,type_id,scope_id,source_id,tile_id,source_specifier) VALUES ((SELECT id FROM effect_ids WHERE effect=?1),?2,(SELECT id FROM effect_type_ids WHERE type=?3),(SELECT id FROM effect_scope_ids WHERE scope=?4),(SELECT id FROM effect_source_ids WHERE source=?5),?6,0)',
    );
    for (const args of [
      ['woodProduction', 1.237, 'bonus', 'local', 'building', tile],
      ['wheatProduction', 1.193, 'bonus', 'global', 'artifact', null],
      ['woodProduction', 1.7, 'bonus-booster', 'local', 'building', tile],
      ['warehouseCapacity', 1.125, 'bonus', 'local', 'building', tile],
      ['unitWheatConsumption', 0.5, 'bonus', 'global', 'artifact', tile],
    ]) {
      insert.bind(args).stepReset();
    }
    insert.finalize();
  }
  if (scenario === 'customTrigger') {
    seed.raw.exec(
      "CREATE TRIGGER scheduler_test AFTER UPDATE ON troops BEGIN UPDATE effects SET value=value+0.125 WHERE effect_id=(SELECT id FROM effect_ids WHERE effect='woodProduction') AND tile_id=NEW.tile_id; END",
    );
  }
  if (scenario === 'rollback') {
    const ids = seed.raw.selectValues(
      'SELECT id FROM events ORDER BY resolves_at,id LIMIT 2',
    );
    seed.raw.exec({
      sql: "UPDATE events SET meta=json_set(meta,'$.unitId','NO_SUCH_UNIT') WHERE id=?1",
      bind: [ids[1]],
    });
  }
  const bytes = seed.database.serialize();
  seed.close();
  const baseline = await open(bytes);
  const engine = await createEngine(bytes, hermes);
  const requests =
    scenario === 'partial' ? [1700000500000, 1700001000000] : [1700001000000];
  for (const now of requests) {
    const request = {
      type: 'advance' as const,
      now,
      limit: 1000,
      notifications: scenario === 'notifications',
    };
    if (scenario === 'rollback') {
      assert.throws(() => execute(baseline.database, request));
      assert.throws(() =>
        engine.dispatch({
          ...request,
        }),
      );
    } else {
      const expected = execute(baseline.database, request);
      const result = engine.dispatch({
        ...request,
      });
      assert.deepEqual(result.data, expected);
      assert.equal(
        result.nextDeadline,
        (expected as { nextDeadline: number | null }).nextDeadline,
      );
      if (scenario === 'notifications') {
        assert.equal(result.notifications.length, 1000);
        assert.ok(
          result.notifications.every(
            (n) =>
              n !== null &&
              typeof n === 'object' &&
              'eventKey' in n &&
              n.eventKey === 'event:success',
          ),
        );
      }
    }
    const saved = await open(engine.snapshot());
    assert.deepEqual(
      normalize(inspect(saved.database)),
      normalize(inspect(baseline.database)),
    );
    if (scenario === 'rollback') {
      assert.equal(saved.raw.selectValue('SELECT COUNT(*) FROM events'), 999);
    }
    saved.close();
  }
  engine.close();
  baseline.close();
});
