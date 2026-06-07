import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createEvents } from '../../../../utils/create-event';
import { resolveEvent } from '../../resolve-event';

const setGatherersHutLevel = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  villageId: number,
  level: number,
) => {
  database.exec({
    sql: `
      INSERT INTO
        building_fields (village_id, field_id, building_id, level)
      SELECT
        $village_id, 20, id, $level
      FROM
        building_ids
      WHERE
        building = 'GATHERERS_HUT'
      ON CONFLICT(village_id, field_id) DO UPDATE SET
        building_id = EXCLUDED.building_id,
        level = EXCLUDED.level;
    `,
    bind: {
      $village_id: villageId,
      $level: level,
    },
  });
};

describe('gatherers hut resolvers', () => {
  test('gatherersHutGatheringTrip should return troops and add gathered resources', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const now = 1_000_000;

    vi.useFakeTimers();
    vi.setSystemTime(now);

    setGatherersHutLevel(database, villageId, 1);
    database.exec({
      sql: 'UPDATE developer_settings SET is_instant_unit_travel_enabled = 1;',
    });

    const villageTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        DELETE FROM troops
        WHERE
          unit_id = (SELECT id FROM unit_ids WHERE unit = 'PHALANX')
          AND tile_id = $tile_id
          AND source_tile_id = $tile_id;
      `,
      bind: {
        $tile_id: villageTileId,
      },
    });

    database.exec({
      sql: `
        INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
        SELECT id, 10, $tile_id, $tile_id
        FROM unit_ids
        WHERE unit = 'PHALANX';
      `,
      bind: {
        $tile_id: villageTileId,
      },
    });

    database.exec({
      sql: `
        UPDATE resource_sites
        SET
          wood = 100,
          clay = 100,
          iron = 100,
          wheat = 100,
          updated_at = $now
        WHERE tile_id = $tile_id;
      `,
      bind: {
        $tile_id: villageTileId,
        $now: now,
      },
    });

    createEvents<'gatherersHutGatheringTrip'>(database, {
      type: 'gatherersHutGatheringTrip',
      villageId,
      troops: [
        {
          unitId: 'PHALANX',
          amount: 5,
          tileId: villageTileId,
          source: villageTileId,
        },
      ],
    });

    const troopsAfterDeparture = database.selectValue({
      sql: `
        SELECT amount
        FROM troops
        WHERE
          unit_id = (SELECT id FROM unit_ids WHERE unit = 'PHALANX')
          AND tile_id = $tile_id
          AND source_tile_id = $tile_id;
      `,
      bind: {
        $tile_id: villageTileId,
      },
      schema: z.number(),
    })!;

    expect(troopsAfterDeparture).toBe(5);

    const eventId = database.selectValue({
      sql: `
        SELECT id
        FROM events
        WHERE
          village_id = $village_id
          AND type = 'gatherersHutGatheringTrip';
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    resolveEvent(database, eventId);

    const troopsAfterReturn = database.selectValue({
      sql: `
        SELECT amount
        FROM troops
        WHERE
          unit_id = (SELECT id FROM unit_ids WHERE unit = 'PHALANX')
          AND tile_id = $tile_id
          AND source_tile_id = $tile_id;
      `,
      bind: {
        $tile_id: villageTileId,
      },
      schema: z.number(),
    })!;

    const resources = database.selectObject({
      sql: `
        SELECT wood, clay, iron, wheat
        FROM resource_sites
        WHERE tile_id = $tile_id;
      `,
      bind: {
        $tile_id: villageTileId,
      },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    expect(troopsAfterReturn).toBe(10);
    expect(resources).toStrictEqual({
      wood: 113,
      clay: 113,
      iron: 112,
      wheat: 112,
    });

    vi.useRealTimers();
  });
});
