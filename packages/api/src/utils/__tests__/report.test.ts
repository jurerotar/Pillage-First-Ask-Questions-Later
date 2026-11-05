import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { insertBattleReport, insertReport } from '../report';

describe(insertReport, () => {
  test('keeps the newest 1,000 non-archived reports', async () => {
    using database = await prepareTestDatabase();

    database.exec({
      sql: 'DELETE FROM reports;',
    });

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
});

describe(insertBattleReport, () => {
  test.each([false, true])(
    'persists supplied hospitalized counts without changing wounded troops (hospital: %s)',
    async (hasHospital) => {
      using database = await prepareTestDatabase();

      const villages = database.selectObjects({
        sql: 'SELECT id, tile_id, player_id FROM villages ORDER BY id LIMIT 3;',
        schema: z.strictObject({
          id: z.int(),
          tile_id: z.int(),
          player_id: z.int(),
        }),
      });

      const [origin, target, reinforcement] = villages;

      database.exec({
        sql: "DELETE FROM building_fields WHERE building_id IN (SELECT id FROM building_ids WHERE building IN ('HOSPITAL', 'ASCLEPEION'));",
      });

      if (hasHospital) {
        database.exec({
          sql: `INSERT INTO building_fields (village_id, field_id, building_id, level)
          VALUES ($village_id, 20, (SELECT id FROM building_ids WHERE building = 'HOSPITAL'), 1)
          ON CONFLICT(village_id, field_id) DO UPDATE SET building_id = excluded.building_id, level = excluded.level;`,
          bind: { $village_id: origin.id },
        });
      }

      database.exec({ sql: 'DELETE FROM wounded_troops;' });
      database.exec({
        sql: "INSERT INTO wounded_troops (village_id, unit_id, amount, updated_at) SELECT $village_id, id, 7, 100 FROM unit_ids WHERE unit = 'LEGIONNAIRE';",
        bind: { $village_id: origin.id },
      });

      const woundedBefore = database.selectObjects({
        sql: 'SELECT * FROM wounded_troops;',
        schema: z.object({
          village_id: z.int(),
          unit_id: z.int(),
          amount: z.int(),
          updated_at: z.int(),
        }),
      });

      const participant = (village: typeof origin) => ({
        playerId: village.player_id,
        tileId: village.tile_id,
      });

      const reportId = insertBattleReport(database, {
        villageId: origin.id,
        timestamp: 200,
        outcome: 'attackerSomeLoss',
        originTileId: origin.tile_id,
        targetTileId: target.tile_id,
        isRaid: false,
        loot: [0, 0, 0, 0],
        canAttackerSeeFullReport: true,
        attackerPoints: 0,
        defenderPoints: 0,
        attacker: {
          ...participant(origin),
          units: [
            {
              unitId: 'LEGIONNAIRE',
              amountBefore: 50,
              amountAfter: 20,
              amountHospitalized: 3,
              amountImprisoned: 2,
            },
            {
              unitId: 'LEGIONNAIRE',
              amountBefore: 50,
              amountAfter: 20,
              amountHospitalized: 4,
              amountImprisoned: 0,
            },
          ],
        },
        defender: {
          ...participant(target),
          units: [
            {
              unitId: 'LEGIONNAIRE',
              amountBefore: 100,
              amountAfter: 50,
              amountHospitalized: 0,
              amountImprisoned: 0,
            },
          ],
        },
        reinforcements: [
          {
            ...participant(reinforcement),
            units: [
              {
                unitId: 'LEGIONNAIRE',
                amountBefore: 100,
                amountAfter: 50,
                amountHospitalized: 11,
                amountImprisoned: 0,
              },
            ],
          },
        ],
      });

      expect(() =>
        database.exec({
          sql: `UPDATE battle_report_units SET amount_hospitalized = 40, amount_imprisoned = 30
          WHERE battle_participant_id IN (SELECT bp.id FROM battle_report_participants bp JOIN battle_reports b ON b.id = bp.battle_id WHERE b.report_id = $report_id);`,
          bind: { $report_id: reportId },
        }),
      ).toThrow();

      expect(() =>
        database.exec({
          sql: `INSERT INTO battle_report_units (battle_participant_id, unit_id, amount_before, amount_after, amount_hospitalized, amount_imprisoned)
          SELECT bp.id, (SELECT id FROM unit_ids WHERE unit = 'PRAETORIAN'), 100, 50, 30, 30
          FROM battle_report_participants bp JOIN battle_reports b ON b.id = bp.battle_id WHERE b.report_id = $report_id LIMIT 1;`,
          bind: { $report_id: reportId },
        }),
      ).toThrow();

      expect(
        database.selectObjects({
          sql: `SELECT bp.tile_id, bu.amount_before, bu.amount_after, bu.amount_hospitalized, bu.amount_imprisoned
        FROM battle_report_units bu JOIN battle_report_participants bp ON bp.id = bu.battle_participant_id
        JOIN battle_reports b ON b.id = bp.battle_id WHERE b.report_id = $report_id ORDER BY bp.id;`,
          bind: { $report_id: reportId },
          schema: z.object({
            tile_id: z.int(),
            amount_before: z.int(),
            amount_after: z.int(),
            amount_hospitalized: z.int(),
            amount_imprisoned: z.int(),
          }),
        }),
      ).toStrictEqual([
        {
          tile_id: origin.tile_id,
          amount_before: 100,
          amount_after: 40,
          amount_hospitalized: 7,
          amount_imprisoned: 2,
        },
        {
          tile_id: target.tile_id,
          amount_before: 100,
          amount_after: 50,
          amount_hospitalized: 0,
          amount_imprisoned: 0,
        },
        {
          tile_id: reinforcement.tile_id,
          amount_before: 100,
          amount_after: 50,
          amount_hospitalized: 11,
          amount_imprisoned: 0,
        },
      ]);

      expect(
        database.selectObjects({
          sql: 'SELECT * FROM wounded_troops;',
          schema: z.object({
            village_id: z.int(),
            unit_id: z.int(),
            amount: z.int(),
            updated_at: z.int(),
          }),
        }),
      ).toStrictEqual(woundedBefore);

      expect(
        database.selectValue({
          sql: "SELECT COUNT(*) FROM sqlite_schema WHERE type = 'trigger' AND name = 'battle_report_units_create_wounded_troops_after_insert';",
          schema: z.int(),
        }),
      ).toBe(0);
    },
  );
});
