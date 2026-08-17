import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createTroopTrainingEventMock } from '@pillage-first/mocks/event';
import type { Unit } from '@pillage-first/types/models/unit';
import { selectWheatProductionEffectIdQuery } from '../../../../queries/effect-queries';
import { troopTrainingEventResolver } from '../troop-resolvers';

describe(troopTrainingEventResolver, () => {
  test('should increase troop count and update wheat consumption', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const unitId: Unit['id'] = 'LEGIONNAIRE';

    // We need to know tile_id of the village to verify troop insertion
    const villageTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    const mockEvent = createTroopTrainingEventMock({
      id: 1,
      startsAt: 1000,
      duration: 100,
      villageId,
      unitId,
      amount: 1,
      batchId: 'batch-1',
      durationEffectId: 'barracksTrainingDuration',
      buildingId: 'BARRACKS',
    });

    troopTrainingEventResolver(database, { ...mockEvent, id: 999 });

    // Verify troops table
    const troop = database.selectValue({
      sql: 'SELECT amount FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id) AND tile_id = $tile_id;',
      bind: { $unit_id: unitId, $tile_id: villageTileId },
      schema: z.number(),
    })!;

    expect(troop).toBeGreaterThanOrEqual(1);

    const wheatEffectId = database.selectValue({
      sql: selectWheatProductionEffectIdQuery,
      schema: z.number(),
    })!;

    // Verify wheat consumption effect
    const effect = database.selectValue({
      sql: `
        SELECT value
        FROM effects
        WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
          AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'troops')
          AND effect_id = $effect_id;
      `,
      bind: { $effect_id: wheatEffectId, $village_id: villageId },
      schema: z.number(),
    })!;

    expect(effect).toBeDefined();

    for (let i = 0; i < 9; i += 1) {
      troopTrainingEventResolver(database, {
        ...mockEvent,
        id: 1000 + i,
        amount: 1, // This is ignored by the resolver; each event resolves one troop.
        resolvesAt: 1200,
      });
    }

    // Verify history table (Trigger should have fired on event deletion)
    // In this test, we are calling the resolver directly, which DOES NOT delete the event from the database.
    // The resolver is just the logic. The deletion happens in resolveEvent (packages/api/src/http/events/resolve-event.ts).
    // Let's manually insert and delete an event to verify the trigger.

    const batchId = 'batch-history-test';
    const startsAt = 2000;
    const duration = 100;
    const buildingId = 'BARRACKS';
    const meta = JSON.stringify({ unitId, batchId, buildingId });

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ('troopTraining', $starts_at, $duration, $village_id, $meta);
      `,
      bind: {
        $starts_at: startsAt,
        $duration: duration,
        $village_id: villageId,
        $meta: meta,
      },
    });

    const eventId = database.selectValue({
      sql: 'SELECT last_insert_rowid();',
      schema: z.number(),
    })!;

    // Resolve (delete) the event
    database.exec({
      sql: 'DELETE FROM events WHERE id = $id;',
      bind: { $id: eventId },
    });

    // Check history - should have 1 entry with amount 1
    const history1 = database.selectValue({
      sql: 'SELECT amount FROM unit_training_history WHERE batch_id = $batch_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id);',
      bind: { $batch_id: batchId, $unit_id: unitId },
      schema: z.number(),
    })!;
    expect(history1).toBe(1);

    // Add and resolve another event in the same batch
    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ('troopTraining', $starts_at + 100, $duration, $village_id, $meta);
      `,
      bind: {
        $starts_at: startsAt + 100,
        $duration: duration,
        $village_id: villageId,
        $meta: meta,
      },
    });

    const eventId2 = database.selectValue({
      sql: 'SELECT last_insert_rowid();',
      schema: z.number(),
    })!;

    database.exec({
      sql: 'DELETE FROM events WHERE id = $id;',
      bind: { $id: eventId2 },
    });

    // Check history - should now have amount 2
    const history2 = database.selectValue({
      sql: 'SELECT amount FROM unit_training_history WHERE batch_id = $batch_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id);',
      bind: { $batch_id: batchId, $unit_id: unitId },
      schema: z.number(),
    })!;
    expect(history2).toBe(2);
  });
});
