import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getHunterLodgeCatchableAnimals } from '@pillage-first/game-assets/utils/hunters-lodge';
import { createEvents } from '../../../../utils/create-event';
import { resolveEvent } from '../../resolve-event';

describe('hunters lodge resolvers', () => {
  test('huntersLodgeHunt should not schedule another hunt after resolving', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const now = 1_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    database.exec({
      sql: `
        INSERT INTO
          building_fields (village_id, field_id, building_id, level)
        SELECT
          $village_id, 20, id, 1
        FROM
          building_ids
        WHERE
          building = 'HUNTERS_LODGE'
        ON CONFLICT(village_id, field_id) DO UPDATE SET
          building_id = EXCLUDED.building_id,
          level = EXCLUDED.level;
      `,
      bind: {
        $village_id: villageId,
      },
    });

    database.exec({
      sql: `
        UPDATE resource_sites
        SET
          wheat = 1000,
          updated_at = $now
        WHERE
          tile_id = (
            SELECT tile_id
            FROM
              villages
            WHERE
              id = $village_id
          );
      `,
      bind: {
        $village_id: villageId,
        $now: now,
      },
    });

    createEvents<'huntersLodgeHunt'>(database, {
      type: 'huntersLodgeHunt',
      villageId,
      huntingPartyLevel: 1,
    });

    const eventId = database.selectValue({
      sql: `
        SELECT id
        FROM
          events
        WHERE
          village_id = $village_id
          AND type = 'huntersLodgeHunt';
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    resolveEvent(database, eventId);

    const remainingHuntCount = database.selectValue({
      sql: `
        SELECT
          COUNT(*)
        FROM
          events
        WHERE
          village_id = $village_id
          AND type = 'huntersLodgeHunt';
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    });

    expect(remainingHuntCount).toBe(0);

    vi.useRealTimers();
  });

  test('huntersLodgeHunt should add one eligible animal to the village', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;

    database.exec({
      sql: `
        INSERT INTO
          building_fields (village_id, field_id, building_id, level)
        SELECT
          $village_id, 20, id, 1
        FROM
          building_ids
        WHERE
          building = 'HUNTERS_LODGE'
        ON CONFLICT(village_id, field_id) DO UPDATE SET
          building_id = EXCLUDED.building_id,
          level = EXCLUDED.level;
      `,
      bind: {
        $village_id: villageId,
      },
    });

    createEvents<'huntersLodgeHunt'>(database, {
      type: 'huntersLodgeHunt',
      villageId,
      huntingPartyLevel: 1,
    });

    const eventId = database.selectValue({
      sql: `
        SELECT id
        FROM
          events
        WHERE
          village_id = $village_id
          AND type = 'huntersLodgeHunt';
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    const wheatProductionFromTroopsBefore = database.selectValue({
      sql: `
        SELECT COALESCE(SUM(e.value), 0)
        FROM
          effects e
            JOIN effect_ids ei ON ei.id = e.effect_id
        WHERE
          e.village_id = $village_id
          AND e.source = 'troops'
          AND ei.effect = 'wheatProduction';
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    const firstOasisTileId = database.selectValue({
      sql: `
        SELECT tile_id
        FROM
          oasis
        ORDER BY id
        LIMIT 1;
      `,
      schema: z.number(),
    })!;

    resolveEvent(database, eventId);

    const caughtAnimals = database.selectObjects({
      sql: `
        SELECT
          ui.unit AS unitId,
          t.amount,
          t.source_tile_id AS sourceTileId
        FROM
          troops t
            JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = (
            SELECT tile_id
            FROM
              villages
            WHERE
              id = $village_id
          )
          AND ui.unit IN ('RAT', 'SPIDER', 'SERPENT');
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.strictObject({
        unitId: z.string(),
        amount: z.number(),
        sourceTileId: z.number(),
      }),
    });

    const wheatProductionFromTroopsAfter = database.selectValue({
      sql: `
        SELECT COALESCE(SUM(e.value), 0)
        FROM
          effects e
            JOIN effect_ids ei ON ei.id = e.effect_id
        WHERE
          e.village_id = $village_id
          AND e.source = 'troops'
          AND ei.effect = 'wheatProduction';
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    expect(caughtAnimals).toHaveLength(1);
    expect(getHunterLodgeCatchableAnimals(1)).toContain(
      caughtAnimals[0]!.unitId,
    );
    expect(caughtAnimals[0]!.amount).toBe(1);
    expect(caughtAnimals[0]!.sourceTileId).toBe(firstOasisTileId);
    expect(wheatProductionFromTroopsAfter).toBe(
      wheatProductionFromTroopsBefore,
    );
  });
});
