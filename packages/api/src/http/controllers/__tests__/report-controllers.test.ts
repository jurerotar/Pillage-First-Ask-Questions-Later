import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  deleteReports,
  getReport,
  getReports,
  updateReports,
} from '../report-controllers';
import { createControllerArgs } from './utils/controller-args';

const prepareReportsTestDatabase = async () => {
  const database = await prepareTestDatabase();

  database.exec({
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
        can_attacker_see_full_report, attacker_points, defender_points
      ) VALUES (
        1, 1,
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
        0, 10, 20, 30, 40, 1, 100, 50
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
  test('should list reports and filter by one or multiple report types', async () => {
    const database = await prepareReportsTestDatabase();

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

    const huntingReports = getReports(
      database,
      createControllerArgs<'/reports'>({
        query: { filters: 'huntingParty' },
      }),
    );

    expect(huntingReports).toHaveLength(1);
    expect(huntingReports.every(({ type }) => type === 'huntingParty')).toBe(
      true,
    );

    const expeditionReports = getReports(
      database,
      createControllerArgs<'/reports'>({
        query: { filters: ['huntingParty', 'gatheringExpedition'] },
      }),
    );

    expect(expeditionReports).toHaveLength(2);
    expect(
      expeditionReports.every(
        ({ type }) => type === 'huntingParty' || type === 'gatheringExpedition',
      ),
    ).toBe(true);
  });

  test('should include custom report types only while their filters are active', async () => {
    const database = await prepareReportsTestDatabase();

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
      createControllerArgs<'/reports'>({
        query: { filters: 'noLoss' },
      }),
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
      createControllerArgs<'/reports'>({
        query: {
          filters: ['noLoss', 'ownTrades'],
        },
      }),
    );

    expect(reportsWithCustomFilters).toHaveLength(6);
    expect(reportsWithCustomFilters.some(({ type }) => type === 'battle')).toBe(
      true,
    );
    expect(reportsWithCustomFilters.some(({ type }) => type === 'trade')).toBe(
      true,
    );

    const reportsWithoutCustomFilters = getReports(
      database,
      createControllerArgs<'/reports'>({
        query: {
          filters: [
            'battle',
            'adventure',
            'movement',
            'trade',
            'huntingParty',
            'gatheringExpedition',
            'scouting',
          ],
        },
      }),
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
    const database = await prepareReportsTestDatabase();
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
    const database = await prepareReportsTestDatabase();

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

    expect(new Set(reports.map(({ type }) => type))).toStrictEqual(
      new Set([
        'battle',
        'adventure',
        'movement',
        'trade',
        'huntingParty',
        'gatheringExpedition',
      ]),
    );

    expect(reports.find(({ type }) => type === 'battle')).toHaveProperty(
      'battle.attacker.troops.units',
    );
    expect(reports.find(({ type }) => type === 'adventure')).toHaveProperty(
      'adventureId',
    );
    expect(reports.find(({ type }) => type === 'movement')).toHaveProperty(
      'movement.units',
    );
    expect(reports.find(({ type }) => type === 'trade')).toHaveProperty(
      'trade.resources',
    );
    expect(reports.find(({ type }) => type === 'huntingParty')).toHaveProperty(
      'units',
    );
    expect(
      reports.find(({ type }) => type === 'gatheringExpedition'),
    ).toHaveProperty('loot');
  });

  test('should reject missing reports', async () => {
    const database = await prepareReportsTestDatabase();

    expect(() =>
      getReport(
        database,
        createControllerArgs<'/reports/:reportId'>({
          path: { reportId: -1 },
        }),
      ),
    ).toThrow('Report -1 not found');
  });

  test('should update tags for multiple reports to their requested state', async () => {
    const database = await prepareReportsTestDatabase();

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
    const database = await prepareReportsTestDatabase();

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
    const database = await prepareReportsTestDatabase();
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
      hunting_parties: 0,
      gathering_expeditions: 0,
      tags: 0,
    });
  });

  test('should delete all scouting report data', async () => {
    const database = await prepareReportsTestDatabase();
    const reportId = 7;

    database.exec({
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
