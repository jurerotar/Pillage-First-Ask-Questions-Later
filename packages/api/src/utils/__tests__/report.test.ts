import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { insertReport } from '../report';

describe(insertReport, () => {
  test('keeps the newest 1,000 non-archived reports', async () => {
    const database = await prepareTestDatabase();

    database.exec({
      sql: `
        WITH RECURSIVE sequence(timestamp) AS (
          SELECT 1
          UNION ALL
          SELECT timestamp + 1 FROM sequence WHERE timestamp < 1000
        )
        INSERT INTO reports (
          village_id,
          timestamp,
          type_id,
          report_outcome_id
        )
        SELECT
          (SELECT id FROM villages ORDER BY id LIMIT 1),
          timestamp,
          (SELECT id FROM report_type_ids WHERE report_type = 'adventure'),
          (SELECT id FROM report_outcome_ids WHERE report_outcome = 'heroAdventure')
        FROM sequence;
      `,
    });
    database.exec({
      sql: `
        INSERT INTO report_tags (report_id, report_tag_id)
        SELECT r.id, rti.id
        FROM reports r
        CROSS JOIN report_tag_ids rti
        WHERE r.timestamp = 1
          AND rti.tag = 'archived';
      `,
    });

    const firstInsertedId = insertReport(database, {
      villageId: 1,
      timestamp: 1001,
      type: 'adventure',
      outcome: 'heroAdventure',
      tags: [],
    });
    const secondInsertedId = insertReport(database, {
      villageId: 1,
      timestamp: 1002,
      type: 'adventure',
      outcome: 'heroAdventure',
      tags: [],
    });

    const timestamps = database.selectValues({
      sql: 'SELECT timestamp FROM reports ORDER BY timestamp;',
      schema: z.int(),
    });

    expect(timestamps).toHaveLength(1001);
    expect(timestamps).toContain(1);
    expect(timestamps).not.toContain(2);
    expect(timestamps).toContain(1001);
    expect(timestamps).toContain(1002);
    expect(firstInsertedId).toBeGreaterThan(0);
    expect(secondInsertedId).toBeGreaterThan(firstInsertedId);
  });

  test('battle report unit insert trigger should create wounded troops from Hospital losses', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, tile_id FROM villages ORDER BY id LIMIT 1;',
      schema: z.strictObject({
        id: z.number(),
        tile_id: z.number(),
      }),
    })!;

    database.exec({
      sql: 'DELETE FROM wounded_troops WHERE village_id = $village_id;',
      bind: { $village_id: village.id },
    });

    database.exec({
      sql: `
        INSERT INTO building_fields (village_id, field_id, building_id, level)
        VALUES (
          $village_id,
          20,
          (SELECT id FROM building_ids WHERE building = 'HOSPITAL'),
          1
        )
        ON CONFLICT(village_id, field_id) DO UPDATE SET
          building_id = excluded.building_id,
          level = excluded.level;
      `,
      bind: { $village_id: village.id },
    });

    database.exec({
      sql: `
        INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
        VALUES (
          10001,
          $village_id,
          123456,
          (SELECT id FROM report_type_ids WHERE report_type = 'battle'),
          (SELECT id FROM report_outcome_ids WHERE report_outcome = 'attackerSomeLoss')
        );
      `,
      bind: {
        $village_id: village.id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_reports (
          id, report_id, origin_tile_id, target_tile_id, is_raid,
          loot_wood, loot_clay, loot_iron, loot_wheat,
          can_attacker_see_full_report, attacker_points, defender_points
        )
        VALUES (
          10001,
          10001,
          $tile_id,
          $tile_id,
          0,
          0, 0, 0, 0,
          1,
          0,
          0
        );
      `,
      bind: {
        $tile_id: village.tile_id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
        VALUES (
          10001,
          10001,
          (SELECT player_id FROM villages WHERE id = $village_id),
          $tile_id
        );
      `,
      bind: {
        $village_id: village.id,
        $tile_id: village.tile_id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_report_units (battle_participant_id, unit_id, amount_before, amount_after)
        VALUES
          (10001, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 100, 50),
          (10001, (SELECT id FROM unit_ids WHERE unit = 'ROMAN_RAM'), 100, 0),
          (10001, (SELECT id FROM unit_ids WHERE unit = 'RAT'), 100, 0);
      `,
    });

    const legionnaireWounded = database.selectValue({
      sql: `
        SELECT amount
        FROM wounded_troops
        WHERE
          village_id = $village_id
          AND unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE');
      `,
      bind: { $village_id: village.id },
      schema: z.number(),
    });

    const ineligibleWoundedCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM wounded_troops wt
          JOIN unit_ids ui ON ui.id = wt.unit_id
        WHERE
          wt.village_id = $village_id
          AND ui.unit IN ('ROMAN_RAM', 'RAT');
      `,
      bind: { $village_id: village.id },
      schema: z.number(),
    });

    expect(legionnaireWounded).toBe(20);
    expect(ineligibleWoundedCount).toBe(0);
  });

  test('battle report unit insert trigger should not create wounded troops without Hospital or Asclepeion', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, tile_id FROM villages ORDER BY id LIMIT 1;',
      schema: z.strictObject({
        id: z.number(),
        tile_id: z.number(),
      }),
    })!;

    database.exec({
      sql: 'DELETE FROM wounded_troops WHERE village_id = $village_id;',
      bind: { $village_id: village.id },
    });

    database.exec({
      sql: `
        UPDATE building_fields
        SET level = 0
        WHERE
          village_id = $village_id
          AND building_id IN (
            SELECT id
            FROM building_ids
            WHERE building IN ('HOSPITAL', 'ASCLEPEION')
          );
      `,
      bind: { $village_id: village.id },
    });

    database.exec({
      sql: `
        INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
        VALUES (
          10003,
          $village_id,
          123456,
          (SELECT id FROM report_type_ids WHERE report_type = 'battle'),
          (SELECT id FROM report_outcome_ids WHERE report_outcome = 'attackerSomeLoss')
        );
      `,
      bind: {
        $village_id: village.id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_reports (
          id, report_id, origin_tile_id, target_tile_id, is_raid,
          loot_wood, loot_clay, loot_iron, loot_wheat,
          can_attacker_see_full_report, attacker_points, defender_points
        )
        VALUES (
          10003,
          10003,
          $tile_id,
          $tile_id,
          0,
          0, 0, 0, 0,
          1,
          0,
          0
        );
      `,
      bind: {
        $tile_id: village.tile_id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
        VALUES (
          10003,
          10003,
          (SELECT player_id FROM villages WHERE id = $village_id),
          $tile_id
        );
      `,
      bind: {
        $village_id: village.id,
        $tile_id: village.tile_id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_report_units (battle_participant_id, unit_id, amount_before, amount_after)
        VALUES (
          10003,
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          100,
          50
        );
      `,
    });

    const woundedCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM wounded_troops
        WHERE village_id = $village_id;
      `,
      bind: { $village_id: village.id },
      schema: z.number(),
    });

    expect(woundedCount).toBe(0);
  });

  test('battle report unit insert trigger should only create wounded troops for player participants', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, tile_id FROM villages ORDER BY id LIMIT 1;',
      schema: z.strictObject({
        id: z.number(),
        tile_id: z.number(),
      }),
    })!;

    database.exec({
      sql: 'DELETE FROM wounded_troops WHERE village_id = $village_id;',
      bind: { $village_id: village.id },
    });

    database.exec({
      sql: `
        INSERT INTO building_fields (village_id, field_id, building_id, level)
        VALUES (
          $village_id,
          20,
          (SELECT id FROM building_ids WHERE building = 'HOSPITAL'),
          1
        )
        ON CONFLICT(village_id, field_id) DO UPDATE SET
          building_id = excluded.building_id,
          level = excluded.level;
      `,
      bind: { $village_id: village.id },
    });

    database.exec({
      sql: `
        INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
        VALUES (
          10004,
          $village_id,
          123456,
          (SELECT id FROM report_type_ids WHERE report_type = 'battle'),
          (SELECT id FROM report_outcome_ids WHERE report_outcome = 'attackerSomeLoss')
        );
      `,
      bind: {
        $village_id: village.id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_reports (
          id, report_id, origin_tile_id, target_tile_id, is_raid,
          loot_wood, loot_clay, loot_iron, loot_wheat,
          can_attacker_see_full_report, attacker_points, defender_points
        )
        VALUES (
          10004,
          10004,
          $tile_id,
          $tile_id,
          0,
          0, 0, 0, 0,
          1,
          0,
          0
        );
      `,
      bind: {
        $tile_id: village.tile_id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
        VALUES (
          10004,
          10004,
          NULL,
          $tile_id
        );
      `,
      bind: {
        $tile_id: village.tile_id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_report_units (battle_participant_id, unit_id, amount_before, amount_after)
        VALUES (
          10004,
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          100,
          50
        );
      `,
    });

    const woundedCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM wounded_troops
        WHERE village_id = $village_id;
      `,
      bind: { $village_id: village.id },
      schema: z.number(),
    });

    expect(woundedCount).toBe(0);
  });

  test('battle report unit insert trigger should use Asclepeion wounded rate', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, tile_id FROM villages ORDER BY id LIMIT 1;',
      schema: z.strictObject({
        id: z.number(),
        tile_id: z.number(),
      }),
    })!;

    database.exec({
      sql: 'DELETE FROM wounded_troops WHERE village_id = $village_id;',
      bind: { $village_id: village.id },
    });

    database.exec({
      sql: `
        INSERT INTO building_fields (village_id, field_id, building_id, level)
        VALUES (
          $village_id,
          20,
          (SELECT id FROM building_ids WHERE building = 'ASCLEPEION'),
          1
        )
        ON CONFLICT(village_id, field_id) DO UPDATE SET
          building_id = excluded.building_id,
          level = excluded.level;
      `,
      bind: { $village_id: village.id },
    });

    database.exec({
      sql: `
        INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
        VALUES (
          10002,
          $village_id,
          123456,
          (SELECT id FROM report_type_ids WHERE report_type = 'battle'),
          (SELECT id FROM report_outcome_ids WHERE report_outcome = 'attackerSomeLoss')
        );
      `,
      bind: {
        $village_id: village.id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_reports (
          id, report_id, origin_tile_id, target_tile_id, is_raid,
          loot_wood, loot_clay, loot_iron, loot_wheat,
          can_attacker_see_full_report, attacker_points, defender_points
        )
        VALUES (
          10002,
          10002,
          $tile_id,
          $tile_id,
          0,
          0, 0, 0, 0,
          1,
          0,
          0
        );
      `,
      bind: {
        $tile_id: village.tile_id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
        VALUES (
          10002,
          10002,
          (SELECT player_id FROM villages WHERE id = $village_id),
          $tile_id
        );
      `,
      bind: {
        $village_id: village.id,
        $tile_id: village.tile_id,
      },
    });

    database.exec({
      sql: `
        INSERT INTO battle_report_units (battle_participant_id, unit_id, amount_before, amount_after)
        VALUES (
          10002,
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          100,
          50
        );
      `,
    });

    const woundedAmount = database.selectValue({
      sql: `
        SELECT amount
        FROM wounded_troops
        WHERE
          village_id = $village_id
          AND unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE');
      `,
      bind: { $village_id: village.id },
      schema: z.number(),
    });

    expect(woundedAmount).toBe(30);
  });
});
