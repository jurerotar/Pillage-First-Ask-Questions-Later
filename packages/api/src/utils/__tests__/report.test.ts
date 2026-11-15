import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import {
  prepareTestDatabase,
  seedTestAdventureReports,
  setTestBuildingLevel,
  setTestWoundedTroopAmount,
} from '@pillage-first/api/testing';
import type { BattleUnit } from '@pillage-first/types/models/battle';
import { prepareReportsTestDatabase } from '../../db/testing/seed-test-reports';
import {
  insertBattleReport,
  insertMovementReport,
  insertReport,
} from '../report';

test('movement reports return the parent report ID', async () => {
  using database = await prepareReportsTestDatabase();

  const [origin, target] = database.selectObjects({
    sql: 'SELECT id, tile_id FROM villages ORDER BY id LIMIT 2;',
    schema: z.strictObject({ id: z.int(), tile_id: z.int() }),
  });

  const reportId = insertMovementReport(database, {
    villageId: origin.id,
    resolvesAt: 1000,
    originTileId: origin.tile_id,
    targetTileId: target.tile_id,
    movementType: 'reinforcement',
    troops: [],
  });

  expect(reportId).toBeDefined();
  expect(
    database.selectValue({
      sql: 'SELECT report_id FROM movement_reports WHERE report_id = $report_id;',
      bind: { $report_id: reportId! },
      schema: z.int(),
    }),
  ).toBe(reportId);
});

describe(insertReport, () => {
  test('keeps the newest 1,000 non-archived reports', async () => {
    using database = await prepareTestDatabase();

    database.exec({
      sql: 'DELETE FROM reports;',
    });

    seedTestAdventureReports(database, 1, 999, 1);

    const boundaryInsertedId = insertReport(database, {
      villageId: 1,
      timestamp: 1000,
      type: 'adventure',
      outcome: 'heroAdventure',
      tags: [],
    });

    expect(
      database.selectValue({
        sql: 'SELECT COUNT(*) FROM reports;',
        schema: z.int(),
      }),
    ).toBe(1000);
    expect(
      database.selectValue({
        sql: 'SELECT MIN(timestamp) FROM reports;',
        schema: z.int(),
      }),
    ).toBe(1);

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
    expect(boundaryInsertedId).toBeDefined();
    expect(firstInsertedId).toBeDefined();
    expect(firstInsertedId).toBeGreaterThan(boundaryInsertedId!);
    expect(secondInsertedId).toBeGreaterThan(firstInsertedId!);
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
        sql: `
          DELETE FROM building_fields
          WHERE building_id IN (
            SELECT id
            FROM building_ids
            WHERE building IN ('HOSPITAL', 'ASCLEPEION')
          );
        `,
      });

      if (hasHospital) {
        setTestBuildingLevel(database, origin.id, 'HOSPITAL', 1, 20);
      }

      database.exec({ sql: 'DELETE FROM wounded_troops;' });
      setTestWoundedTroopAmount(database, origin.id, 'LEGIONNAIRE', 7, 100);

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
        hero: null,
        playerId: village.player_id,
        tileId: village.tile_id,
      });

      const baseUnit = {
        unitId: 'LEGIONNAIRE',
        amountBefore: 100,
        amountAfter: 50,
        amountHospitalized: 0,
        amountImprisoned: 0,
        amountBandaged: 0,
        amountConsumed: 0,
      } satisfies BattleUnit;

      const reportId = insertBattleReport(database, {
        villageId: origin.id,
        timestamp: 200,
        outcome: 'attackerSomeLoss',
        originTileId: origin.tile_id,
        targetTileId: target.tile_id,
        isRaid: false,
        loot: [0, 0, 0, 0],
        attackerPoints: 0,
        defenderPoints: 0,
        loyaltyBefore: null,
        loyaltyAfter: null,
        conquest: null,
        villageDestroyed: false,
        trapsDestroyed: 0,
        rescuedUnits: [],
        capturedAnimals: [],
        stolenItems: [],
        siegeResults: [],
        attacker: {
          ...participant(origin),
          units: [
            {
              ...baseUnit,
              amountBefore: 50,
              amountAfter: 20,
              amountHospitalized: 3,
              amountImprisoned: 2,
            },
            {
              ...baseUnit,
              amountBefore: 50,
              amountAfter: 20,
              amountHospitalized: 4,
            },
          ],
        },
        defender: {
          ...participant(target),
          units: [baseUnit],
        },
        reinforcements: [
          {
            ...participant(reinforcement),
            units: [{ ...baseUnit, amountHospitalized: 11 }],
          },
        ],
      });

      const units = database.selectObjects({
        sql: `
          SELECT
            bp.tile_id,
            bu.amount_before,
            bu.amount_after,
            bu.amount_hospitalized,
            bu.amount_imprisoned
          FROM
            battle_report_units bu
            JOIN battle_report_participants bp ON bp.id = bu.battle_participant_id
            JOIN battle_reports b ON b.id = bp.battle_id
          WHERE
            b.report_id = $report_id;
        `,
        bind: { $report_id: reportId },
        schema: z.object({
          tile_id: z.int(),
          amount_before: z.int(),
          amount_after: z.int(),
          amount_hospitalized: z.int(),
          amount_imprisoned: z.int(),
        }),
      });

      expect(units).toHaveLength(3);
      expect(units).toEqual(
        expect.arrayContaining([
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
        ]),
      );

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
    },
  );
});
