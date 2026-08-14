import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  reportOutcomeSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';
import { resourcesSchema } from '@pillage-first/types/models/resource';
import { unitIdSchema } from '@pillage-first/types/models/unit';
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
      schema: resourcesSchema,
    })!;

    expect(troopsAfterReturn).toBe(10);
    expect(resources).toStrictEqual({
      wood: 105,
      clay: 105,
      iron: 105,
      wheat: 105,
    });

    const completedGatheringTripCount = database.selectValue({
      sql: 'SELECT completed FROM gatherers_hut_expeditions WHERE village_id = $village_id;',
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    expect(completedGatheringTripCount).toBe(1);

    const report = database.selectObject({
      sql: `
        SELECT r.village_id, rti.report_type, roi.report_outcome,
          ger.village_tile_id, ger.loot_wood, ger.loot_clay,
          ger.loot_iron, ger.loot_wheat, ui.unit AS unit_id, geru.amount
        FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id
        JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
        JOIN gathering_expedition_reports ger ON ger.report_id = r.id
        JOIN gathering_expedition_report_units geru ON geru.gathering_expedition_report_id = ger.id
        JOIN unit_ids ui ON ui.id = geru.unit_id
        WHERE rti.report_type = 'gatheringExpedition'
        ORDER BY r.id DESC LIMIT 1;
      `,
      schema: z.strictObject({
        village_id: z.int(),
        report_type: reportTypeSchema,
        report_outcome: reportOutcomeSchema,
        village_tile_id: z.int(),
        loot_wood: z.int(),
        loot_clay: z.int(),
        loot_iron: z.int(),
        loot_wheat: z.int(),
        unit_id: unitIdSchema,
        amount: z.int(),
      }),
    })!;
    expect(report).toStrictEqual({
      village_id: villageId,
      report_type: 'gatheringExpedition',
      report_outcome: 'gatheringExpedition',
      village_tile_id: villageTileId,
      loot_wood: 5,
      loot_clay: 5,
      loot_iron: 5,
      loot_wheat: 5,
      unit_id: 'PHALANX',
      amount: 5,
    });

    vi.useRealTimers();
  });
});
