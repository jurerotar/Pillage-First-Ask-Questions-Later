import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { items } from '@pillage-first/game-assets/items';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('reportsSeeder', () => {
  test('seeds 100 player reports', () => {
    const reportCounts = database.selectObject({
      sql: `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE rt.report_type = 'battle') AS battles
        FROM reports r
        JOIN report_type_ids rt ON r.type_id = rt.id
        WHERE r.player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({ total: z.number(), battles: z.number() }),
    })!;

    expect(reportCounts).toEqual({ total: 100, battles: 50 });
  });

  test('every seeded battle report has one battle with real tiles and report outcome', () => {
    const invalidBattleCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM reports r
        LEFT JOIN battle_reports b ON b.report_id = r.id
        LEFT JOIN tiles origin_t ON b.origin_tile_id = origin_t.id
        LEFT JOIN tiles target_t ON b.target_tile_id = target_t.id
        LEFT JOIN report_outcome_ids roi ON r.report_outcome_id = roi.id
        JOIN report_type_ids rti ON r.type_id = rti.id
        WHERE
          r.player_id = $player_id
          AND rti.report_type = 'battle'
          AND (
            b.id IS NULL
            OR origin_t.id IS NULL
            OR target_t.id IS NULL
            OR roi.id IS NULL
          );
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    expect(invalidBattleCount).toBe(0);
  });

  test('seeds all non-battle reports with detail rows', () => {
    const reportCounts = database.selectObjects({
      sql: `
        SELECT rti.report_type AS type, COUNT(*) AS count
        FROM reports r
        JOIN report_type_ids rti ON r.type_id = rti.id
        WHERE r.player_id = $player_id
        GROUP BY rti.report_type
        ORDER BY rti.report_type;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({ type: z.string(), count: z.number() }),
    });

    expect(reportCounts).toStrictEqual([
      { type: 'adventure', count: 10 },
      { type: 'battle', count: 50 },
      { type: 'gatheringExpedition', count: 10 },
      { type: 'huntingParty', count: 10 },
      { type: 'movement', count: 10 },
      { type: 'trade', count: 10 },
    ]);

    const detailCounts = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*) FROM hero_adventure_reports) AS adventures,
          (SELECT COUNT(*) FROM movement_reports) AS movements,
          (SELECT COUNT(*) FROM movement_report_units) AS movement_units,
          (SELECT COUNT(*) FROM trade_reports) AS trades,
          (SELECT COUNT(*) FROM hunting_party_reports) AS hunting_parties,
          (SELECT COUNT(*) FROM hunting_party_report_units) AS hunting_party_units,
          (SELECT COUNT(*) FROM gathering_expedition_reports) AS gathering_expeditions,
          (SELECT COUNT(*) FROM gathering_expedition_report_units) AS gathering_expedition_units;
      `,
      schema: z.strictObject({
        adventures: z.number(),
        movements: z.number(),
        movement_units: z.number(),
        trades: z.number(),
        hunting_parties: z.number(),
        hunting_party_units: z.number(),
        gathering_expeditions: z.number(),
        gathering_expedition_units: z.number(),
      }),
    });

    expect(detailCounts).toStrictEqual({
      adventures: 10,
      movements: 10,
      movement_units: 10,
      trades: 10,
      hunting_parties: 10,
      hunting_party_units: 30,
      gathering_expeditions: 10,
      gathering_expedition_units: 10,
    });
  });

  test('seeded adventure rewards only reference real hero items', () => {
    const seededItems = database.selectObjects({
      sql: `
        SELECT item_id, item_amount
        FROM hero_adventure_reports
        WHERE item_id IS NOT NULL;
      `,
      schema: z.strictObject({
        item_id: z.number(),
        item_amount: z.number().int().positive(),
      }),
    });
    const realItemIds = new Set(items.map(({ id }) => id));

    expect(seededItems.length).toBeGreaterThan(0);
    expect(seededItems.every(({ item_id }) => realItemIds.has(item_id))).toBe(
      true,
    );
  });

  test('seeded battles include participants and unit rows', () => {
    const battleCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM battle_reports;',
      schema: z.number(),
    });
    const battleCountWithParticipants = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM battle_reports b
        WHERE (
          SELECT COUNT(*)
          FROM battle_report_participants bp
          WHERE bp.battle_id = b.id
        ) >= 2;
      `,
      schema: z.number(),
    });
    const battleCountWithUnits = database.selectValue({
      sql: `
        SELECT COUNT(DISTINCT b.id)
        FROM battle_reports b
        JOIN battle_report_participants bp ON bp.battle_id = b.id
        JOIN battle_report_units bu ON bu.battle_participant_id = bp.id;
      `,
      schema: z.number(),
    });

    expect(battleCount).toBe(50);
    expect(battleCountWithParticipants).toBe(50);
    expect(battleCountWithUnits).toBe(50);
  });

  test('seeded battle troop counts are internally consistent', () => {
    const invalidUnitCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM battle_report_units
        WHERE
          amount_before < 0
          OR amount_after < 0
          OR amount_after > amount_before;
      `,
      schema: z.number(),
    });

    expect(invalidUnitCount).toBe(0);
  });

  test('some seeded battles include reinforcements', () => {
    const reinforcedBattleCount = database.selectValue({
      sql: `
        SELECT COUNT(DISTINCT b.id)
        FROM battle_reports b
        JOIN battle_report_participants bp ON bp.battle_id = b.id
        WHERE
          bp.tile_id != b.origin_tile_id
          AND bp.tile_id != b.target_tile_id;
      `,
      schema: z.number(),
    });

    expect(reinforcedBattleCount).toBeGreaterThan(0);
  });

  test('defender reports always show the full battle', () => {
    const hiddenDefenderReportCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM reports r
        JOIN battle_reports b ON b.report_id = r.id
        JOIN villages target_v ON target_v.tile_id = b.target_tile_id
        WHERE
          r.player_id = $player_id
          AND target_v.player_id = $player_id
          AND b.can_attacker_see_full_report = 0;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    const hiddenAttackerReportCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM reports r
        JOIN battle_reports b ON b.report_id = r.id
        JOIN villages origin_v ON origin_v.tile_id = b.origin_tile_id
        WHERE
          r.player_id = $player_id
          AND origin_v.player_id = $player_id
          AND b.can_attacker_see_full_report = 0;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    expect(hiddenDefenderReportCount).toBe(0);
    expect(hiddenAttackerReportCount).toBeGreaterThan(0);
  });
});
