import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import {
  type ReportListingFilter,
  type ReportScope,
  reportFilterNameByScope,
} from '@pillage-first/types/dtos/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  type CreateNewBattleReport,
  insertBattleReport,
} from '../../../utils/report';
import {
  deleteReports,
  getReport,
  getReports,
  getTileReports,
  updateReports,
} from '../report-controllers';
import { createControllerArgs } from './utils/controller-args';

const setActiveReportFilters = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  filters: ReportListingFilter[],
  scope: ReportScope = 'global',
): void => {
  const filterName = reportFilterNameByScope[scope];

  database.transaction((tx) => {
    tx.exec({
      sql: `
        DELETE FROM filters
        WHERE name = $name;
      `,
      bind: { $name: filterName },
    });

    tx.exec({
      sql: `
        INSERT INTO filters (player_id, name, filter)
        SELECT 1, $name, value
        FROM JSON_EACH($filters);
      `,
      bind: {
        $filters: JSON.stringify(filters),
        $name: filterName,
      },
    });
  });
};

const prepareReportsTestDatabase = async () => {
  const database = await prepareTestDatabase();

  database.exec({
    sql: 'DELETE FROM reports;',
  });

  database.execMulti({
    sql: `
      INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
      VALUES
        (1, (SELECT id FROM villages ORDER BY id LIMIT 1), 1000, (SELECT id FROM report_type_ids WHERE report_type = 'battle'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'attackerNoLoss')),
        (2, (SELECT id FROM villages ORDER BY id LIMIT 1), 2000, (SELECT id FROM report_type_ids WHERE report_type = 'adventure'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'heroAdventure')),
        (3, (SELECT id FROM villages ORDER BY id LIMIT 1), 3000, (SELECT id FROM report_type_ids WHERE report_type = 'movement'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'troopMovement')),
        (4, (SELECT id FROM villages ORDER BY id LIMIT 1), 4000, (SELECT id FROM report_type_ids WHERE report_type = 'trade'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'outgoingMerchantsArrived')),
        (5, (SELECT id FROM villages ORDER BY id LIMIT 1), 5000, (SELECT id FROM report_type_ids WHERE report_type = 'huntingParty'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'huntingParty')),
        (6, (SELECT id FROM villages ORDER BY id LIMIT 1), 6000, (SELECT id FROM report_type_ids WHERE report_type = 'gatheringExpedition'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'gatheringExpedition'));
    `,
  });

  database.exec({
    sql: `
      INSERT INTO report_tags (report_id, report_tag_id)
      VALUES
        (1, (SELECT id FROM report_tag_ids WHERE tag = 'read')),
        (2, (SELECT id FROM report_tag_ids WHERE tag = 'archived'));
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_reports (
        id, report_id, origin_tile_id, target_tile_id, is_raid,
        loot_wood, loot_clay, loot_iron, loot_wheat,
        attacker_points, defender_points
      ) VALUES (
        1, 1,
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
        0, 10, 20, 30, 40, 100, 50
      );
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
      SELECT 1, 1, player_id, tile_id FROM villages ORDER BY id LIMIT 1;
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
      SELECT 2, 1, player_id, tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1;
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_report_units (battle_participant_id, unit_id, amount_before, amount_after)
      VALUES
        (1, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 10, 8),
        (2, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 5, 0);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_report_buildings (
        battle_id,
        building_id,
        level_before,
        level_after
      )
      VALUES
        (1, (SELECT id FROM building_ids WHERE building = 'RALLY_POINT'), 10, 4),
        (1, (SELECT id FROM building_ids WHERE building = 'WHEAT_FIELD'), 8, 0);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO hero_adventure_reports (
        report_id, adventure_id, item_id, item_amount, health_before, health_after
      ) VALUES (2, 1, NULL, NULL, 100, 95);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO movement_reports (id, report_id, origin_tile_id, target_tile_id, movement_type)
      VALUES (
        1, 3,
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
        'reinforcement'
      );
    `,
  });

  database.exec({
    sql: `
      INSERT INTO movement_report_units (movement_report_id, unit_id, amount)
      VALUES (1, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 10);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO trade_reports (
        id, report_id, origin_tile_id, target_tile_id, wood, clay, iron, wheat
      ) VALUES (
        1, 4,
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
        100, 200, 300, 400
      );
    `,
  });

  database.exec({
    sql: `
      INSERT INTO hunting_party_reports (id, report_id, village_tile_id)
      VALUES (1, 5, (SELECT tile_id FROM villages ORDER BY id LIMIT 1));
    `,
  });

  database.exec({
    sql: `
      INSERT INTO hunting_party_report_units (hunting_party_report_id, unit_id, amount)
      VALUES (1, (SELECT id FROM unit_ids WHERE unit = 'RAT'), 3);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO gathering_expedition_reports (
        id, report_id, village_tile_id, tribe_id,
        loot_wood, loot_clay, loot_iron, loot_wheat
      ) VALUES (
        1, 6,
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
        (SELECT p.tribe_id FROM villages v JOIN players p ON p.id = v.player_id ORDER BY v.id LIMIT 1),
        40, 30, 20, 10
      );
    `,
  });

  database.exec({
    sql: `
      INSERT INTO gathering_expedition_report_units (
        gathering_expedition_report_id, unit_id, amount
      ) VALUES (1, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 4);
    `,
  });

  return database;
};

describe('report-controllers', () => {
  test('lists only player battle and scouting reports targeting the tile, independent of report filters', async () => {
    using database = await prepareReportsTestDatabase();
    const tileId = database.selectValue({
      sql: 'SELECT target_tile_id FROM battle_reports WHERE report_id = 1;',
      schema: z.number(),
    })!;

    database.execMulti({
      sql: `
        INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
        SELECT 7, village_id, 2000,
          (SELECT id FROM report_type_ids WHERE report_type = 'scouting'),
          (SELECT id FROM report_outcome_ids WHERE report_outcome = 'scoutAttackerNoLoss')
        FROM reports WHERE id = 1;

        INSERT INTO scouting_reports (
          report_id, origin_tile_id, target_tile_id, perspective, successful, scouting_target
        )
        SELECT 7, origin_tile_id, target_tile_id, 'attacker', 1, 'resources'
        FROM battle_reports WHERE report_id = 1;

        INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
        SELECT 8, (SELECT id FROM villages WHERE player_id != 1 LIMIT 1), 3000, type_id, report_outcome_id
        FROM reports WHERE id = 1;

        INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
        SELECT 9, village_id, 4000, type_id, report_outcome_id
        FROM reports WHERE id = 1;

        INSERT INTO battle_reports (
          report_id, origin_tile_id, target_tile_id, is_raid,
          loot_wood, loot_clay, loot_iron, loot_wheat,
          attacker_points, defender_points
        )
        SELECT r.id, b.origin_tile_id,
          CASE WHEN r.id = 9 THEN b.origin_tile_id ELSE b.target_tile_id END,
          b.is_raid, b.loot_wood, b.loot_clay, b.loot_iron, b.loot_wheat,
          b.attacker_points, b.defender_points
        FROM reports r CROSS JOIN battle_reports b
        WHERE r.id IN (8, 9) AND b.report_id = 1;
      `,
    });

    setActiveReportFilters(database, []);

    expect(
      getReports(database, createControllerArgs<'/reports'>({})),
    ).toStrictEqual([]);

    const reports = getTileReports(
      database,
      createControllerArgs<'/tiles/:tileId/reports'>({ path: { tileId } }),
    );

    expect(reports.map(({ id, type }) => ({ id, type }))).toStrictEqual([
      { id: 7, type: 'scouting' },
      { id: 1, type: 'battle' },
    ]);
    expect(reports[1].tags).toContain('read');
    expect(reports[0].tags).not.toContain('read');
  });

  test('limits tile reports to ten, ordered by timestamp then id descending', async () => {
    using database = await prepareReportsTestDatabase();
    const tileId = database.selectValue({
      sql: 'SELECT target_tile_id FROM battle_reports WHERE report_id = 1;',
      schema: z.number(),
    })!;

    database.execMulti({
      sql: `
        INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
        SELECT value, r.village_id, CASE WHEN value = 10 THEN 3000 ELSE 2000 END,
          r.type_id, r.report_outcome_id
        FROM json_each('[10,11,12,13,14,15,16,17,18,19,20,21]')
        CROSS JOIN reports r WHERE r.id = 1;

        INSERT INTO battle_reports (
          report_id, origin_tile_id, target_tile_id, is_raid,
          loot_wood, loot_clay, loot_iron, loot_wheat,
          attacker_points, defender_points
        )
        SELECT r.id, b.origin_tile_id, b.target_tile_id,
          b.is_raid, b.loot_wood, b.loot_clay, b.loot_iron, b.loot_wheat,
          b.attacker_points, b.defender_points
        FROM reports r CROSS JOIN battle_reports b
        WHERE r.id >= 10 AND b.report_id = 1;
      `,
    });

    const reports = getTileReports(
      database,
      createControllerArgs<'/tiles/:tileId/reports'>({ path: { tileId } }),
    );

    expect(reports.map(({ id }) => id)).toStrictEqual([
      10, 21, 20, 19, 18, 17, 16, 15, 14, 13,
    ]);
  });

  test('returns an empty list for tiles without matching reports', async () => {
    using database = await prepareReportsTestDatabase();
    const tileId = database.selectValue({
      sql: 'SELECT origin_tile_id FROM battle_reports WHERE report_id = 1;',
      schema: z.number(),
    })!;

    expect(
      getTileReports(
        database,
        createControllerArgs<'/tiles/:tileId/reports'>({ path: { tileId } }),
      ),
    ).toStrictEqual([]);
  });

  test('should list reports and filter by one or multiple report types', async () => {
    using database = await prepareReportsTestDatabase();

    const allReports = getReports(
      database,
      createControllerArgs<'/reports'>({}),
    );

    expect(allReports).toHaveLength(6);
    expect(new Set(allReports.map(({ type }) => type))).toStrictEqual(
      new Set([
        'battle',
        'adventure',
        'movement',
        'trade',
        'huntingParty',
        'gatheringExpedition',
      ]),
    );

    setActiveReportFilters(database, ['huntingParty']);

    const huntingReports = getReports(
      database,
      createControllerArgs<'/reports'>({}),
    );

    expect(huntingReports).toHaveLength(1);
    expect(huntingReports.every(({ type }) => type === 'huntingParty')).toBe(
      true,
    );

    setActiveReportFilters(database, ['huntingParty', 'gatheringExpedition']);

    const expeditionReports = getReports(
      database,
      createControllerArgs<'/reports'>({}),
    );

    expect(expeditionReports).toHaveLength(2);
    expect(
      expeditionReports.every(
        ({ type }) => type === 'huntingParty' || type === 'gatheringExpedition',
      ),
    ).toBe(true);
  });

  test('should use separate report filters for each report scope', async () => {
    using database = await prepareReportsTestDatabase();

    setActiveReportFilters(database, ['huntingParty'], 'global');
    setActiveReportFilters(database, ['trade'], 'unread');

    const globalReports = getReports(
      database,
      createControllerArgs<'/reports'>({
        query: { scope: 'global' },
      }),
    );

    const unreadReports = getReports(
      database,
      createControllerArgs<'/reports'>({
        query: { scope: 'unread' },
      }),
    );

    expect(globalReports).toHaveLength(1);
    expect(globalReports.every(({ type }) => type === 'huntingParty')).toBe(
      true,
    );
    expect(unreadReports).toHaveLength(1);
    expect(unreadReports.every(({ type }) => type === 'trade')).toBe(true);
  });

  test('should include custom report types only while their filters are active', async () => {
    using database = await prepareReportsTestDatabase();

    database.exec({
      sql: `
        UPDATE reports
        SET report_outcome_id = (
          SELECT id FROM report_outcome_ids
          WHERE report_outcome = 'defenderNoLoss'
        )
        WHERE id = 1;
      `,
    });

    const reportsWithDefenderVictory = getReports(
      database,
      createControllerArgs<'/reports'>({}),
    );

    expect(reportsWithDefenderVictory).toHaveLength(6);

    database.exec({
      sql: `
        UPDATE trade_reports
        SET target_tile_id = origin_tile_id;
      `,
    });

    database.exec({
      sql: `
        UPDATE reports
        SET report_outcome_id = (
          SELECT id FROM report_outcome_ids
          WHERE report_outcome = 'attackerNoLoss'
        )
        WHERE id = 1;
      `,
    });

    const reportsWithCustomFilters = getReports(
      database,
      createControllerArgs<'/reports'>({}),
    );

    expect(reportsWithCustomFilters).toHaveLength(6);
    expect(reportsWithCustomFilters.some(({ type }) => type === 'battle')).toBe(
      true,
    );
    expect(reportsWithCustomFilters.some(({ type }) => type === 'trade')).toBe(
      true,
    );

    setActiveReportFilters(database, [
      'battle',
      'adventure',
      'movement',
      'trade',
      'huntingParty',
      'gatheringExpedition',
      'scouting',
    ]);

    const reportsWithoutCustomFilters = getReports(
      database,
      createControllerArgs<'/reports'>({}),
    );

    expect(reportsWithoutCustomFilters).toHaveLength(4);
    expect(
      reportsWithoutCustomFilters.some(({ type }) => type === 'battle'),
    ).toBe(false);
    expect(
      reportsWithoutCustomFilters.some(({ type }) => type === 'trade'),
    ).toBe(false);
  });

  test('should apply unread, archived, and village scopes', async () => {
    using database = await prepareReportsTestDatabase();
    const villageId = database.selectValue({
      sql: 'SELECT id FROM villages ORDER BY id LIMIT 1;',
      schema: z.int(),
    })!;

    const unreadReports = getReports(
      database,
      createControllerArgs<'/reports'>({
        query: { scope: 'unread' },
      }),
    );

    expect(unreadReports.length).toBeGreaterThan(0);
    expect(unreadReports.every(({ tags }) => !tags.includes('read'))).toBe(
      true,
    );

    const archivedReports = getReports(
      database,
      createControllerArgs<'/reports'>({
        query: { scope: 'archived' },
      }),
    );

    expect(archivedReports.length).toBeGreaterThan(0);
    expect(archivedReports.every(({ tags }) => tags.includes('archived'))).toBe(
      true,
    );

    const villageReports = getReports(
      database,
      createControllerArgs<'/reports'>({
        query: { scope: 'village', villageId },
      }),
    );

    expect(villageReports.length).toBeGreaterThan(0);
    expect(
      villageReports.every((report) => report.villageId === villageId),
    ).toBe(true);
  });

  test('should return complete detail DTOs for every report type', async () => {
    using database = await prepareReportsTestDatabase();

    const reportIds = database.selectObjects({
      sql: `SELECT rti.report_type AS type, MIN(r.id) AS id FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id GROUP BY rti.report_type;`,
      schema: z.strictObject({ type: z.string(), id: z.int() }),
    });

    const reports = reportIds.map(({ id }) =>
      getReport(
        database,
        createControllerArgs<'/reports/:reportId'>({
          path: { reportId: id },
        }),
      ),
    );

    expect(reports).not.toContain(null);

    const existingReports = reports.filter((report) => report !== null);

    expect(new Set(existingReports.map(({ type }) => type))).toStrictEqual(
      new Set([
        'battle',
        'adventure',
        'movement',
        'trade',
        'huntingParty',
        'gatheringExpedition',
      ]),
    );
    expect(
      existingReports.find(({ type }) => type === 'battle'),
    ).toHaveProperty('battle.attacker.troops.units');
    expect(
      existingReports.find(({ type }) => type === 'battle'),
    ).toHaveProperty('battle.damagedBuildings', [
      { buildingId: 'RALLY_POINT', levelBefore: 10, levelAfter: 4 },
      { buildingId: 'WHEAT_FIELD', levelBefore: 8, levelAfter: 0 },
    ]);
    expect(
      existingReports.find(({ type }) => type === 'adventure'),
    ).toHaveProperty('adventureId');
    expect(
      existingReports.find(({ type }) => type === 'movement'),
    ).toHaveProperty('movement.units');
    expect(existingReports.find(({ type }) => type === 'trade')).toHaveProperty(
      'trade.resources',
    );
    expect(
      existingReports.find(({ type }) => type === 'huntingParty'),
    ).toHaveProperty('units');
    expect(
      existingReports.find(({ type }) => type === 'gatheringExpedition'),
    ).toHaveProperty('loot');
  });

  test('should include item details in battle and scouting report DTOs', async () => {
    using database = await prepareReportsTestDatabase();
    const scoutingReportId = 7;

    database.exec({
      sql: `
        INSERT INTO battle_report_stolen_items (battle_id, item_id, amount)
        SELECT id, 1021, 3 FROM battle_reports WHERE report_id = 1;
      `,
    });

    database.execMulti({
      sql: `
        INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
        VALUES (${scoutingReportId}, (SELECT id FROM villages ORDER BY id LIMIT 1), 7000,
          (SELECT id FROM report_type_ids WHERE report_type = 'scouting'),
          (SELECT id FROM report_outcome_ids WHERE report_outcome = 'scoutAttackerNoLoss'));
      `,
    });

    database.exec({
      sql: `
        INSERT INTO scouting_reports (
          id,
          report_id,
          origin_tile_id,
          target_tile_id,
          perspective,
          successful,
          scouting_target,
          wood,
          clay,
          iron,
          wheat,
          item_id,
          item_amount
        )
        VALUES (
          1,
          ${scoutingReportId},
          (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
          (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
          'attacker',
          1,
          'resources',
          10,
          20,
          30,
          40,
          1022,
          1
        );
      `,
    });

    database.exec({
      sql: `
        INSERT INTO scouting_report_attacker_units (scouting_report_id, unit_id, amount_before, amount_after)
        VALUES (1, (SELECT id FROM unit_ids WHERE unit = 'ROMAN_SCOUT'), 10, 10);
      `,
    });

    database.exec({
      sql: `
        INSERT INTO scouting_report_units (scouting_report_id, role, tile_id, unit_id, amount)
        VALUES (1, 'defender',
          (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 20);
      `,
    });

    const battleReport = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({
        path: { reportId: 1 },
      }),
    );

    const scoutingReport = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({
        path: { reportId: scoutingReportId },
      }),
    );

    expect(battleReport).toHaveProperty('battle.outcome.stolenItems', [
      { itemId: 1021, amount: 3 },
    ]);
    expect(scoutingReport).toHaveProperty('scouting.itemId', 1022);
    expect(scoutingReport).toHaveProperty('scouting.itemAmount', 1);
  });

  test('weights supply by crop consumption and excludes prisoners from losses', async () => {
    using database = await prepareReportsTestDatabase();

    database.execMulti({
      sql: `INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
        SELECT 3, 1, player_id, tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 2;
        INSERT INTO battle_report_units (
          battle_participant_id, unit_id, amount_before, amount_after, amount_hospitalized, amount_imprisoned
        ) VALUES
          (1, (SELECT id FROM unit_ids WHERE unit = 'EQUITES_IMPERATORIS'), 10, 6, 1, 2),
          (3, (SELECT id FROM unit_ids WHERE unit = 'EQUITES_IMPERATORIS'), 4, 1, 0, 1);
        UPDATE battle_report_units SET amount_imprisoned = 5 WHERE battle_participant_id = 2;`,
    });

    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({
        path: { reportId: 1 },
      }),
    );

    expect(report?.type).toBe('battle');

    if (report?.type !== 'battle') {
      throw new Error('Expected a battle report');
    }

    expect(report.battle.statistics).toStrictEqual({
      attacker: {
        points: 100,
        supplyBefore: 40,
        supplyLost: 8,
        resourcesLost: 3620,
      },
      defender: {
        points: 50,
        supplyBefore: 17,
        supplyLost: 6,
        resourcesLost: 2820,
      },
    });
  });

  test('should return null for missing reports', async () => {
    using database = await prepareReportsTestDatabase();

    expect(
      getReport(
        database,
        createControllerArgs<'/reports/:reportId'>({
          path: { reportId: -1 },
        }),
      ),
    ).toBeNull();
  });

  test('should mark reports as read when their details are viewed', async () => {
    using database = await prepareReportsTestDatabase();

    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({
        path: { reportId: 2 },
      }),
    );

    expect(report?.tags).toContain('read');

    const hasReadTag = database.selectValue({
      sql: `
        SELECT EXISTS (
          SELECT 1
          FROM report_tags rt
          JOIN report_tag_ids rti ON rti.id = rt.report_tag_id
          WHERE rt.report_id = 2 AND rti.tag = 'read'
        );
      `,
      schema: z.coerce.boolean(),
    });

    expect(hasReadTag).toBe(true);
  });

  test('should update tags for multiple reports to their requested state', async () => {
    using database = await prepareReportsTestDatabase();

    const reports = getReports(database, createControllerArgs<'/reports'>({}));

    const reportIds = reports.slice(0, 2).map(({ id }) => id);

    expect(reportIds).toHaveLength(2);

    updateReports(
      database,
      createControllerArgs<'/reports', 'patch'>({
        body: {
          reportIds,
          tags: { read: true, archived: false },
        },
      }),
    );

    let updatedReports = getReports(
      database,
      createControllerArgs<'/reports'>({}),
    ).filter(({ id }) => reportIds.includes(id));

    expect(updatedReports).toHaveLength(2);
    expect(updatedReports.every(({ tags }) => tags.includes('read'))).toBe(
      true,
    );
    expect(updatedReports.every(({ tags }) => !tags.includes('archived'))).toBe(
      true,
    );

    updateReports(
      database,
      createControllerArgs<'/reports', 'patch'>({
        body: {
          reportIds,
          tags: { read: false, archived: true },
        },
      }),
    );

    updatedReports = getReports(
      database,
      createControllerArgs<'/reports'>({}),
    ).filter(({ id }) => reportIds.includes(id));

    expect(updatedReports.every(({ tags }) => !tags.includes('read'))).toBe(
      true,
    );
    expect(updatedReports.every(({ tags }) => tags.includes('archived'))).toBe(
      true,
    );
  });

  test('should delete hunting party and gathering expedition details', async () => {
    using database = await prepareReportsTestDatabase();

    const reportIds = database.selectValues({
      sql: `
        SELECT MIN(r.id) AS id
        FROM reports r JOIN report_type_ids rti ON rti.id = r.type_id
        WHERE rti.report_type IN ('huntingParty', 'gatheringExpedition')
        GROUP BY rti.report_type
        ORDER BY rti.report_type;
      `,
      schema: z.int(),
    });

    expect(reportIds).toHaveLength(2);

    deleteReports(
      database,
      createControllerArgs<'/reports', 'delete'>({ body: reportIds }),
    );

    const remainingDetails = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*) FROM hunting_party_reports WHERE report_id IN (SELECT value FROM json_each($report_ids))) AS hunting_reports,
          (SELECT COUNT(*) FROM hunting_party_report_units WHERE hunting_party_report_id NOT IN (SELECT id FROM hunting_party_reports)) AS orphaned_hunting_units,
          (SELECT COUNT(*) FROM gathering_expedition_reports WHERE report_id IN (SELECT value FROM json_each($report_ids))) AS gathering_reports,
          (SELECT COUNT(*) FROM gathering_expedition_report_units WHERE gathering_expedition_report_id NOT IN (SELECT id FROM gathering_expedition_reports)) AS orphaned_gathering_units;
      `,
      bind: { $report_ids: JSON.stringify(reportIds) },
      schema: z.strictObject({
        hunting_reports: z.int(),
        orphaned_hunting_units: z.int(),
        gathering_reports: z.int(),
        orphaned_gathering_units: z.int(),
      }),
    })!;

    expect(remainingDetails).toStrictEqual({
      hunting_reports: 0,
      orphaned_hunting_units: 0,
      gathering_reports: 0,
      orphaned_gathering_units: 0,
    });
  });

  test('should delete selected reports of every type and all dependent rows', async () => {
    using database = await prepareReportsTestDatabase();
    const reportIds = database.selectValues({
      sql: `
        SELECT MIN(r.id) FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id
        GROUP BY rti.report_type;
      `,
      schema: z.int(),
    });

    expect(reportIds).toHaveLength(6);

    deleteReports(
      database,
      createControllerArgs<'/reports', 'delete'>({ body: reportIds }),
    );

    const remaining = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*) FROM reports WHERE id IN (SELECT value FROM json_each($ids))) AS reports,
          (SELECT COUNT(*) FROM hero_adventure_reports WHERE report_id IN (SELECT value FROM json_each($ids))) AS adventures,
          (SELECT COUNT(*) FROM movement_reports WHERE report_id IN (SELECT value FROM json_each($ids))) AS movements,
          (SELECT COUNT(*) FROM trade_reports WHERE report_id IN (SELECT value FROM json_each($ids))) AS trades,
          (SELECT COUNT(*) FROM battle_reports WHERE report_id IN (SELECT value FROM json_each($ids))) AS battles,
          (SELECT COUNT(*) FROM battle_report_buildings) AS battle_buildings,
          (SELECT COUNT(*) FROM hunting_party_reports WHERE report_id IN (SELECT value FROM json_each($ids))) AS hunting_parties,
          (SELECT COUNT(*) FROM gathering_expedition_reports WHERE report_id IN (SELECT value FROM json_each($ids))) AS gathering_expeditions,
          (SELECT COUNT(*) FROM report_tags WHERE report_id IN (SELECT value FROM json_each($ids))) AS tags;
      `,
      bind: { $ids: JSON.stringify(reportIds) },
      schema: z.strictObject({
        reports: z.int(),
        adventures: z.int(),
        movements: z.int(),
        trades: z.int(),
        battles: z.int(),
        battle_buildings: z.int(),
        hunting_parties: z.int(),
        gathering_expeditions: z.int(),
        tags: z.int(),
      }),
    })!;

    expect(remaining).toStrictEqual({
      reports: 0,
      adventures: 0,
      movements: 0,
      trades: 0,
      battles: 0,
      battle_buildings: 0,
      hunting_parties: 0,
      gathering_expeditions: 0,
      tags: 0,
    });
  });

  test('should delete all scouting report data', async () => {
    using database = await prepareReportsTestDatabase();
    const reportId = 7;

    database.execMulti({
      sql: `
        INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
        VALUES (${reportId}, (SELECT id FROM villages ORDER BY id LIMIT 1), 7000,
          (SELECT id FROM report_type_ids WHERE report_type = 'scouting'),
          (SELECT id FROM report_outcome_ids WHERE report_outcome = 'scoutAttackerNoLoss'));
        INSERT INTO scouting_reports (id, report_id, origin_tile_id, target_tile_id, perspective, successful, scouting_target, wood, clay, iron, wheat)
        VALUES (1, ${reportId},
          (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
          (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
          'attacker', 1, 'defensiveStructures', NULL, NULL, NULL, NULL);
        INSERT INTO scouting_report_attacker_units (scouting_report_id, unit_id, amount_before, amount_after)
        VALUES (1, (SELECT id FROM unit_ids WHERE unit = 'ROMAN_SCOUT'), 10, 8);
        INSERT INTO scouting_report_units (scouting_report_id, role, tile_id, unit_id, amount)
        VALUES (1, 'defender',
          (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 20);
        INSERT INTO scouting_report_structures (scouting_report_id, building_id, level)
        VALUES (1, (SELECT id FROM building_ids WHERE building = 'RESIDENCE'), 10);
      `,
    });

    deleteReports(
      database,
      createControllerArgs<'/reports', 'delete'>({ body: [reportId] }),
    );

    const remaining = database.selectObject({
      sql: `SELECT
        (SELECT COUNT(*) FROM reports WHERE id = ${reportId}) AS reports,
        (SELECT COUNT(*) FROM scouting_reports WHERE report_id = ${reportId}) AS scouting_reports,
        (SELECT COUNT(*) FROM scouting_report_attacker_units) AS attacker_units,
        (SELECT COUNT(*) FROM scouting_report_units) AS scouted_units,
        (SELECT COUNT(*) FROM scouting_report_structures) AS structures;`,
      schema: z.strictObject({
        reports: z.int(),
        scouting_reports: z.int(),
        attacker_units: z.int(),
        scouted_units: z.int(),
        structures: z.int(),
      }),
    })!;

    expect(remaining).toStrictEqual({
      reports: 0,
      scouting_reports: 0,
      attacker_units: 0,
      scouted_units: 0,
      structures: 0,
    });
  });
});

const createCombatOutcomeReport = (database: DbFacade) => {
  const [origin, target, reinforcement] = database.selectObjects({
    sql: 'SELECT id, tile_id, player_id FROM villages ORDER BY id LIMIT 3;',
    schema: z.strictObject({
      id: z.int(),
      tile_id: z.int(),
      player_id: z.int(),
    }),
  });
  const input: CreateNewBattleReport = {
    villageId: origin.id,
    timestamp: 5000,
    outcome: 'attackerSomeLoss',
    originTileId: origin.tile_id,
    targetTileId: target.tile_id,
    isRaid: false,
    loot: [10, 20, 30, 40],
    attackerPoints: 50,
    defenderPoints: 20,
    loyaltyBefore: 20.5,
    loyaltyAfter: 0,
    conquest: { target: 'village', succeeded: true, failureReason: null },
    villageDestroyed: false,
    trapsDestroyed: 12,
    damagedBuildings: [
      { buildingId: 'WAREHOUSE', levelBefore: 20, levelAfter: 12 },
    ],
    rescuedUnits: [
      {
        playerId: reinforcement.player_id,
        homeTileId: reinforcement.tile_id,
        unitId: 'LEGIONNAIRE',
        amountFreed: 20,
        amountDied: 5,
      },
    ],
    capturedAnimals: [{ unitId: 'RAT', amount: 3 }],
    stolenItems: [
      { itemId: 10001, amount: 1 },
      { itemId: 1021, amount: 3 },
    ],
    attacker: {
      playerId: origin.player_id,
      tileId: origin.tile_id,
      units: [
        {
          unitId: 'LEGIONNAIRE',
          amountBefore: 100,
          amountAfter: 50,
          amountHospitalized: 10,
          amountImprisoned: 5,
          amountBandaged: 8,
          amountConsumed: 0,
        },
        {
          unitId: 'ROMAN_CHIEF',
          amountBefore: 1,
          amountAfter: 0,
          amountHospitalized: 0,
          amountImprisoned: 0,
          amountBandaged: 0,
          amountConsumed: 1,
        },
      ],
      hero: {
        heroId: 7001,
        healthBefore: 100,
        healthAfter: 50,
        experienceGained: 123,
        consumables: [{ itemId: 1023, amount: 3 }],
      },
    },
    defender: {
      playerId: target.player_id,
      tileId: target.tile_id,
      units: [],
      hero: {
        heroId: 7002,
        healthBefore: 50,
        healthAfter: 0,
        experienceGained: 24,
        consumables: [],
      },
    },
    reinforcements: [
      {
        playerId: reinforcement.player_id,
        tileId: reinforcement.tile_id,
        units: [],
        hero: {
          heroId: 7003,
          healthBefore: 100,
          healthAfter: 0,
          experienceGained: 45,
          consumables: [{ itemId: 1021, amount: 2 }],
        },
      },
    ],
  };

  return { input, reportId: insertBattleReport(database, input) };
};

describe('battle combat outcome reports', () => {
  test('writes outcomes inside an existing event transaction', async () => {
    using database = await prepareReportsTestDatabase();

    expect(() =>
      database.transaction((tx) => {
        createCombatOutcomeReport(tx);
      }),
    ).not.toThrow();
  });

  test('round trips special outcomes and each participant hero without changing live game state', async () => {
    using database = await prepareReportsTestDatabase();
    const tables = [
      'troops',
      'heroes',
      'hero_inventory',
      'hero_equipped_items',
      'wounded_troops',
      'world_items',
      'villages',
      'oasis',
      'trapper_cages',
    ];
    const snapshot = () =>
      tables.map((table) =>
        database.selectObjects({
          sql: `SELECT * FROM ${table};`,
          schema: z.record(z.string(), z.unknown()),
        }),
      );
    const before = snapshot();

    const { input, reportId } = createCombatOutcomeReport(database);
    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
    );

    expect(report?.type).toBe('battle');

    if (report?.type !== 'battle') {
      throw new Error('Expected a battle report');
    }

    expect(report.battle.outcome).toMatchObject({
      loyaltyBefore: 20.5,
      loyaltyAfter: 0,
      conquest: input.conquest,
      villageDestroyed: false,
      trapsDestroyed: 12,
      rescuedUnits: input.rescuedUnits,
      capturedAnimals: input.capturedAnimals,
      stolenItems: expect.arrayContaining(input.stolenItems!),
    });
    expect(report.battle.outcome.stolenItems).toHaveLength(
      input.stolenItems!.length,
    );
    expect(report.battle.damagedBuildings).toStrictEqual(
      input.damagedBuildings,
    );
    expect(report.battle.attacker.troops.units).toEqual(
      expect.arrayContaining(input.attacker.units),
    );
    expect(report.battle.attacker.troops.hero).toStrictEqual(
      input.attacker.hero,
    );
    expect(report.battle.defender.troops.hero).toStrictEqual(
      input.defender.hero,
    );
    expect(report.battle.defender.reinforcements[0].troops.hero).toStrictEqual(
      input.reinforcements?.[0].hero,
    );
    expect(report.battle.statistics.attacker.resourcesLost).toBe(14800);
    expect(snapshot()).toStrictEqual(before);
  });

  test('returns empty special outcomes for an ordinary battle', async () => {
    using database = await prepareReportsTestDatabase();

    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({ path: { reportId: 1 } }),
    );

    expect(report).toHaveProperty('battle.attacker.troops.hero', null);
    expect(report).toHaveProperty('battle.outcome.loyaltyBefore', null);
    expect(report).toHaveProperty('battle.outcome.loyaltyAfter', null);
    expect(report).toHaveProperty('battle.outcome.conquest', null);
    expect(report).toHaveProperty('battle.outcome.villageDestroyed', false);
    expect(report).toHaveProperty('battle.outcome.trapsDestroyed', 0);
    expect(report).toHaveProperty('battle.outcome.rescuedUnits', []);
    expect(report).toHaveProperty('battle.outcome.capturedAnimals', []);
    expect(report).toHaveProperty('battle.outcome.stolenItems', []);
    expect(
      database.selectValue({
        sql: 'SELECT COUNT(*) FROM battle_report_conquests;',
        schema: z.int(),
      }),
    ).toBe(0);
    expect(
      database.selectValue({
        sql: 'SELECT COUNT(*) FROM battle_report_rescues;',
        schema: z.int(),
      }),
    ).toBe(0);
  });

  test('deletes all combat outcome details with their report', async () => {
    using database = await prepareReportsTestDatabase();
    const buildingsBefore = database.selectValue({
      sql: 'SELECT COUNT(*) FROM battle_report_buildings;',
      schema: z.int(),
    });
    const { reportId } = createCombatOutcomeReport(database);

    deleteReports(
      database,
      createControllerArgs<'/reports', 'delete'>({
        body: [reportId],
      }),
    );

    expect(
      database.selectValue({
        sql: 'SELECT COUNT(*) FROM battle_report_buildings;',
        schema: z.int(),
      }),
    ).toBe(buildingsBefore);

    for (const table of [
      'battle_report_conquests',
      'battle_report_rescues',
      'battle_report_heroes',
      'battle_report_consumables',
      'battle_report_rescued_units',
      'battle_report_captured_animals',
      'battle_report_stolen_items',
    ]) {
      expect(
        database.selectValue({
          sql: `SELECT COUNT(*) FROM ${table};`,
          schema: z.int(),
        }),
      ).toBe(0);
    }
  });

  test('rolls back report writes when troop disposition counts overlap', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createCombatOutcomeReport(database);
    const reportsBefore = database.selectValue({
      sql: 'SELECT COUNT(*) FROM reports;',
      schema: z.int(),
    });
    input.attacker.units[0].amountBandaged = 100;

    expect(() => insertBattleReport(database, input)).toThrow();

    expect(
      database.selectValue({
        sql: 'SELECT COUNT(*) FROM reports;',
        schema: z.int(),
      }),
    ).toBe(reportsBefore);
  });

  test('stores unsuccessful oasis conquest outcomes', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createCombatOutcomeReport(database);
    input.conquest = {
      target: 'oasis',
      succeeded: false,
      failureReason: 'no-free-oasis-slot',
    };
    input.loyaltyAfter = 10;
    input.targetTileId = database.selectValue({
      sql: `SELECT t.id FROM tiles t JOIN tile_type_ids tt ON tt.id = t.type_id WHERE tt.type = 'oasis' LIMIT 1;`,
      schema: z.int(),
    })!;
    input.defender = { playerId: null, tileId: input.targetTileId, units: [] };
    const reportId = insertBattleReport(database, input);

    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
    );

    expect(
      database.selectObject({
        sql: `SELECT o.reason AS oasis_reason, c.village_conquest_failure_reason_id AS village_reason_id
        FROM battle_reports b
        JOIN battle_report_conquests c ON c.battle_id = b.id
        JOIN oasis_capture_failure_reason_ids o ON o.id = c.oasis_capture_failure_reason_id
        WHERE b.report_id = $report_id;`,
        bind: { $report_id: reportId },
        schema: z.strictObject({
          oasis_reason: z.string(),
          village_reason_id: z.int().nullable(),
        }),
      }),
    ).toStrictEqual({
      oasis_reason: 'no-free-oasis-slot',
      village_reason_id: null,
    });
    expect(report).toHaveProperty('battle.outcome.conquest', input.conquest);
    expect(report).toHaveProperty('battle.outcome.loyaltyAfter', 10);
    expect(report).toHaveProperty('battle.outcome.villageDestroyed', false);
  });

  test('stores village failure reasons through the village lookup table', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createCombatOutcomeReport(database);
    input.conquest = {
      target: 'village',
      succeeded: false,
      failureReason: 'administration-building-present',
    };
    input.loyaltyAfter = input.loyaltyBefore;

    const reportId = insertBattleReport(database, input);
    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
    );

    expect(report).toHaveProperty('battle.outcome.conquest', input.conquest);
    expect(
      database.selectObject({
        sql: `SELECT v.reason AS village_reason, c.oasis_capture_failure_reason_id AS oasis_reason_id
        FROM battle_reports b
        JOIN battle_report_conquests c ON c.battle_id = b.id
        JOIN village_conquest_failure_reason_ids v ON v.id = c.village_conquest_failure_reason_id
        WHERE b.report_id = $report_id;`,
        bind: { $report_id: reportId },
        schema: z.strictObject({
          village_reason: z.string(),
          oasis_reason_id: z.int().nullable(),
        }),
      }),
    ).toStrictEqual({
      village_reason: 'administration-building-present',
      oasis_reason_id: null,
    });
  });

  test('rejects failure reasons from the wrong target lookup', async () => {
    using database = await prepareReportsTestDatabase();
    const { input, reportId } = createCombatOutcomeReport(database);
    const invalidInput = JSON.parse(
      JSON.stringify({
        ...input,
        conquest: {
          target: 'village',
          succeeded: false,
          failureReason: 'no-free-oasis-slot',
        },
      }),
    );

    expect(() => insertBattleReport(database, invalidInput)).toThrow();
    expect(() =>
      database.exec({
        sql: `UPDATE battle_report_conquests SET succeeded = 0,
        village_conquest_failure_reason_id = (SELECT id FROM village_conquest_failure_reason_ids WHERE reason = 'administration-building-present'),
        oasis_capture_failure_reason_id = (SELECT id FROM oasis_capture_failure_reason_ids WHERE reason = 'no-free-oasis-slot')
        WHERE battle_id = (SELECT id FROM battle_reports WHERE report_id = $report_id);`,
        bind: { $report_id: reportId },
      }),
    ).toThrow();
  });

  test('stores village destruction independently of a conquest attempt', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createCombatOutcomeReport(database);
    input.conquest = null;
    input.loyaltyBefore = null;
    input.loyaltyAfter = null;
    input.villageDestroyed = true;

    const reportId = insertBattleReport(database, input);
    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
    );

    expect(report).toHaveProperty('battle.outcome.conquest', null);
    expect(report).toHaveProperty('battle.outcome.villageDestroyed', true);
  });

  test('rejects a conquest target that disagrees with the tile type', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createCombatOutcomeReport(database);
    input.conquest = { target: 'oasis', succeeded: true, failureReason: null };

    expect(() => insertBattleReport(database, input)).toThrow(
      'Conquest target must match the target tile type',
    );
  });

  test('stores destroyed traps without requiring rescued-unit rows', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createCombatOutcomeReport(database);
    input.conquest = null;
    input.loyaltyBefore = null;
    input.loyaltyAfter = null;
    input.trapsDestroyed = 15;
    input.rescuedUnits = [];

    const reportId = insertBattleReport(database, input);
    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
    );

    expect(report).toHaveProperty('battle.outcome.trapsDestroyed', 15);
    expect(report).toHaveProperty('battle.outcome.rescuedUnits', []);
    expect(
      database.selectObject({
        sql: `SELECT r.traps_destroyed,
        (SELECT COUNT(*) FROM battle_report_rescued_units u WHERE u.battle_id = b.id) AS rescued_unit_rows,
        (SELECT COUNT(*) FROM battle_report_conquests c WHERE c.battle_id = b.id) AS conquest_rows
        FROM battle_reports b JOIN battle_report_rescues r ON r.battle_id = b.id WHERE b.report_id = $report_id;`,
        bind: { $report_id: reportId },
        schema: z.strictObject({
          traps_destroyed: z.int(),
          rescued_unit_rows: z.int(),
          conquest_rows: z.int(),
        }),
      }),
    ).toStrictEqual({
      traps_destroyed: 15,
      rescued_unit_rows: 0,
      conquest_rows: 0,
    });
  });

  test('stores a rescue summary when units are rescued without destroyed traps', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createCombatOutcomeReport(database);
    input.trapsDestroyed = 0;

    const reportId = insertBattleReport(database, input);
    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
    );

    expect(report).toHaveProperty('battle.outcome.trapsDestroyed', 0);
    expect(report).toHaveProperty(
      'battle.outcome.rescuedUnits',
      input.rescuedUnits,
    );
    expect(
      database.selectValue({
        sql: 'SELECT r.traps_destroyed FROM battle_report_rescues r JOIN battle_reports b ON b.id = r.battle_id WHERE b.report_id = $report_id;',
        bind: { $report_id: reportId },
        schema: z.int(),
      }),
    ).toBe(0);
  });
});
