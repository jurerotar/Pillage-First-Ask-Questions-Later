import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getHunterLodgeCatchableAnimals } from '@pillage-first/game-assets/utils/hunters-lodge';
import {
  reportOutcomeSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';
import { unitIdSchema } from '@pillage-first/types/models/unit';
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
          e.tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
          AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'troops')
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
        unitId: unitIdSchema,
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
          e.tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
          AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'troops')
          AND ei.effect = 'wheatProduction';
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    expect(caughtAnimals).toHaveLength(1);
    expect(getHunterLodgeCatchableAnimals(1)).toContain(
      caughtAnimals[0].unitId,
    );
    expect(caughtAnimals[0].amount).toBe(1);
    expect(caughtAnimals[0].sourceTileId).toBe(firstOasisTileId);
    expect(wheatProductionFromTroopsAfter).toBe(
      wheatProductionFromTroopsBefore,
    );

    const report = database.selectObject({
      sql: `
        SELECT r.village_id, r.timestamp, rti.report_type, roi.report_outcome,
          hpr.village_tile_id, ui.unit AS unit_id, hpru.amount
        FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id
        JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
        JOIN hunting_party_reports hpr ON hpr.report_id = r.id
        JOIN hunting_party_report_units hpru ON hpru.hunting_party_report_id = hpr.id
        JOIN unit_ids ui ON ui.id = hpru.unit_id
        WHERE rti.report_type = 'huntingParty'
        ORDER BY r.id DESC LIMIT 1;
      `,
      schema: z.strictObject({
        village_id: z.int(),
        timestamp: z.int(),
        report_type: reportTypeSchema,
        report_outcome: reportOutcomeSchema,
        village_tile_id: z.int(),
        unit_id: unitIdSchema,
        amount: z.int(),
      }),
    })!;

    expect(report).toMatchObject({
      village_id: villageId,
      report_type: 'huntingParty',
      report_outcome: 'huntingParty',
      village_tile_id: database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = 1;',
        schema: z.int(),
      }),
      unit_id: caughtAnimals[0].unitId,
      amount: 1,
    });

    const completedCaptureQuestCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM quests
        WHERE
          village_id IS NULL
          AND completed_at IS NOT NULL
          AND quest_id IN (
            'captureAnimalCountById-RAT-1',
            'captureAnimalCountById-SPIDER-1',
            'captureAnimalCountById-SERPENT-1'
          );
      `,
      schema: z.number(),
    });

    expect(completedCaptureQuestCount).toBe(1);
  });
});
