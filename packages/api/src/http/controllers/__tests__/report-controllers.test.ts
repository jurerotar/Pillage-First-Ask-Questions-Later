import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import {
  type ReportListingFilter,
  type ReportScope,
  reportFilterNameByScope,
} from '@pillage-first/types/dtos/report';
import type { BattleSiegeResult } from '@pillage-first/types/models/battle';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  type CreateNewBattleReport,
  insertAdventureReport,
  insertBattleReport,
  insertScheduledConstructionCancellationReport,
  insertScoutingReport,
  insertUnitImprovementReport,
  insertUnitResearchReport,
  insertVillageFoundedReport,
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
        attacker_points, defender_points, village_destroyed
      ) VALUES (
        1, 1,
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
        0, 10, 20, 30, 40, 100, 50, 0
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
      INSERT INTO battle_report_units (battle_participant_id, unit_id, amount_before, amount_after, amount_hospitalized, amount_imprisoned, amount_bandaged, amount_consumed)
      VALUES
        (1, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 10, 8, 0, 0, 0, 0),
        (2, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 5, 0, 0, 0, 0, 0);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_report_buildings (
        battle_id,
        building_id,
        field_id,
        targeting,
        outcome,
        level_before,
        level_after
      )
      VALUES
        (1, (SELECT id FROM building_ids WHERE building = 'RALLY_POINT'), 39, 'random', 'damaged', 10, 4),
        (1, (SELECT id FROM building_ids WHERE building = 'WHEAT_FIELD'), 1, 'random', 'destroyed', 8, 0);
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
          attacker_points, defender_points, village_destroyed
        )
        SELECT r.id, CASE WHEN r.id = 9 THEN b.target_tile_id ELSE b.origin_tile_id END,
          CASE WHEN r.id = 9 THEN b.origin_tile_id ELSE b.target_tile_id END,
          b.is_raid, b.loot_wood, b.loot_clay, b.loot_iron, b.loot_wheat,
          b.attacker_points, b.defender_points, b.village_destroyed
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
          attacker_points, defender_points, village_destroyed
        )
        SELECT r.id, b.origin_tile_id, b.target_tile_id,
          b.is_raid, b.loot_wood, b.loot_clay, b.loot_iron, b.loot_wheat,
          b.attacker_points, b.defender_points, b.village_destroyed
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

  test.each([
    'attacker',
    'defender',
    'scoutAttacker',
    'scoutDefender',
  ] as const)(
    'applies the no-loss filter to %s reports without hiding other outcomes or report types',
    async (perspective) => {
      using database = await prepareReportsTestDatabase();
      const isScouting = perspective.startsWith('scout');

      if (isScouting) {
        database.execMulti({
          sql: `
            UPDATE reports
            SET type_id = (SELECT id FROM report_type_ids WHERE report_type = 'scouting')
            WHERE id = 1;

            INSERT INTO scouting_reports (
              report_id, origin_tile_id, target_tile_id, perspective, successful, scouting_target
            )
            SELECT 1, origin_tile_id, target_tile_id, 'attacker', 1, 'resources'
            FROM battle_reports WHERE report_id = 1;
          `,
        });
      }

      for (const losses of ['NoLoss', 'SomeLoss', 'FullLoss'] as const) {
        database.exec({
          sql: `
            UPDATE reports
            SET report_outcome_id = (
              SELECT id FROM report_outcome_ids WHERE report_outcome = $outcome
            )
            WHERE id = 1;
          `,
          bind: { $outcome: `${perspective}${losses}` },
        });

        setActiveReportFilters(database, ['battle', 'scouting', 'adventure']);

        expect(
          getReports(database, createControllerArgs<'/reports'>({})).map(
            ({ id }) => id,
          ),
        ).toStrictEqual(losses === 'NoLoss' ? [2] : [2, 1]);

        setActiveReportFilters(database, [
          'battle',
          'scouting',
          'adventure',
          'noLoss',
        ]);

        expect(
          getReports(database, createControllerArgs<'/reports'>({})).map(
            ({ id }) => id,
          ),
        ).toStrictEqual([2, 1]);
      }

      setActiveReportFilters(database, ['adventure', 'noLoss']);

      expect(
        getReports(database, createControllerArgs<'/reports'>({})).map(
          ({ id }) => id,
        ),
      ).toStrictEqual([2]);
    },
  );

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
        UPDATE villages
        SET player_id = (SELECT player_id FROM villages WHERE tile_id = (SELECT origin_tile_id FROM trade_reports LIMIT 1))
        WHERE tile_id = (SELECT target_tile_id FROM trade_reports LIMIT 1);
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

  test('should return complete detail DTOs for the seeded report types', async () => {
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
    ).toHaveProperty('battle.siegeResults', [
      {
        fieldId: 39,
        requestedBuildingId: null,
        buildingId: 'RALLY_POINT',
        targeting: 'random',
        outcome: 'damaged',
        reason: null,
        levelBefore: 10,
        levelAfter: 4,
      },
      {
        fieldId: 1,
        requestedBuildingId: null,
        buildingId: 'WHEAT_FIELD',
        targeting: 'random',
        outcome: 'destroyed',
        reason: null,
        levelBefore: 8,
        levelAfter: 0,
      },
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

  test('weights supply by crop consumption and excludes prisoners from losses', async () => {
    using database = await prepareReportsTestDatabase();

    database.execMulti({
      sql: `INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
        SELECT 3, 1, player_id, tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 2;
        INSERT INTO battle_report_units (
          battle_participant_id, unit_id, amount_before, amount_after, amount_hospitalized, amount_imprisoned, amount_bandaged, amount_consumed
        ) VALUES
          (1, (SELECT id FROM unit_ids WHERE unit = 'EQUITES_IMPERATORIS'), 10, 6, 1, 2, 0, 0),
          (3, (SELECT id FROM unit_ids WHERE unit = 'EQUITES_IMPERATORIS'), 4, 1, 0, 1, 0, 0);
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

  test.each([
    { reportId: 1, preservedTag: 'read', updatedTag: 'archived' },
    { reportId: 2, preservedTag: 'archived', updatedTag: 'read' },
  ] as const)(
    'updating $updatedTag preserves $preservedTag and unselected reports',
    async ({ reportId, preservedTag, updatedTag }) => {
      using database = await prepareReportsTestDatabase();
      const unselectedTags = () =>
        database.selectObjects({
          sql: `SELECT rt.report_id, ti.tag FROM report_tags rt
          JOIN report_tag_ids ti ON ti.id = rt.report_tag_id
          WHERE rt.report_id != $report_id ORDER BY rt.report_id, ti.tag;`,
          bind: { $report_id: reportId },
          schema: z.strictObject({ report_id: z.int(), tag: z.string() }),
        });
      const before = unselectedTags();
      const selectedTags = () =>
        database.selectValues({
          sql: `SELECT ti.tag FROM report_tags rt
          JOIN report_tag_ids ti ON ti.id = rt.report_tag_id
          WHERE rt.report_id = $report_id ORDER BY ti.tag;`,
          bind: { $report_id: reportId },
          schema: z.string(),
        });

      for (const enabled of [true, true, false]) {
        updateReports(
          database,
          createControllerArgs<'/reports', 'patch'>({
            body: { reportIds: [reportId], tags: { [updatedTag]: enabled } },
          }),
        );
        expect(selectedTags()).toStrictEqual(
          enabled ? ['archived', 'read'] : [preservedTag],
        );
        expect(unselectedTags()).toStrictEqual(before);
      }
    },
  );

  test('should delete the seeded report types and all dependent rows', async () => {
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
          (SELECT COUNT(*) FROM hunting_party_report_units WHERE hunting_party_report_id NOT IN (SELECT id FROM hunting_party_reports)) AS orphaned_hunting_units,
          (SELECT COUNT(*) FROM gathering_expedition_reports WHERE report_id IN (SELECT value FROM json_each($ids))) AS gathering_expeditions,
          (SELECT COUNT(*) FROM gathering_expedition_report_units WHERE gathering_expedition_report_id NOT IN (SELECT id FROM gathering_expedition_reports)) AS orphaned_gathering_units,
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
        orphaned_hunting_units: z.int(),
        gathering_expeditions: z.int(),
        orphaned_gathering_units: z.int(),
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
      orphaned_hunting_units: 0,
      gathering_expeditions: 0,
      orphaned_gathering_units: 0,
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

describe('research, improvement, founding, and construction cancellation reports', () => {
  test.each([
    'unitResearch',
    'unitImprovement',
    'villageFounded',
    'missing-resources',
    'missing-requirements',
  ] as const)('lists, reads, and deletes a %s report', async (kind) => {
    using database = await prepareReportsTestDatabase();
    const existingIds = database.selectValues({
      sql: 'SELECT id FROM reports ORDER BY id;',
      schema: z.int(),
    });
    const [origin, target] = database.selectObjects({
      sql: `SELECT v.id, v.tile_id, v.name, t.x, t.y FROM villages v
        JOIN tiles t ON t.id = v.tile_id JOIN players p ON p.id = v.player_id
        JOIN tribe_ids ti ON ti.id = p.tribe_id
        WHERE ti.tribe = 'romans' ORDER BY v.id LIMIT 2;`,
      schema: z.strictObject({
        id: z.int(),
        tile_id: z.int(),
        name: z.string(),
        x: z.int(),
        y: z.int(),
      }),
    });
    const commonInput = { villageId: origin.id, timestamp: 7000 };
    const villageSummary = {
      villageId: origin.id,
      villageName: origin.name,
      villageCoordinates: { x: origin.x, y: origin.y },
    };
    const reportCase = (() => {
      switch (kind) {
        case 'unitResearch': {
          return {
            type: kind,
            outcome: 'unitResearched',
            table: 'unit_research_reports',
            id: insertUnitResearchReport(database, {
              ...commonInput,
              unitId: 'PRAETORIAN',
            }),
            details: { summary: villageSummary, unitId: 'PRAETORIAN' },
          };
        }
        case 'unitImprovement': {
          return {
            type: kind,
            outcome: 'unitImproved',
            table: 'unit_improvement_reports',
            id: insertUnitImprovementReport(database, {
              ...commonInput,
              unitId: 'LEGIONNAIRE',
              level: 7,
            }),
            details: {
              summary: villageSummary,
              unitId: 'LEGIONNAIRE',
              level: 7,
            },
          };
        }
        case 'villageFounded': {
          return {
            type: kind,
            outcome: 'villageFounded',
            table: 'village_founding_reports',
            id: insertVillageFoundedReport(database, {
              ...commonInput,
              originTileId: origin.tile_id,
              targetTileId: target.tile_id,
            }),
            details: {
              summary: {
                originName: origin.name,
                originCoordinates: { x: origin.x, y: origin.y },
                targetName: target.name,
                targetCoordinates: { x: target.x, y: target.y },
              },
              originTileId: origin.tile_id,
              targetTileId: target.tile_id,
            },
          };
        }
        case 'missing-resources':
        case 'missing-requirements': {
          const input: Parameters<
            typeof insertScheduledConstructionCancellationReport
          >[1] = {
            ...commonInput,
            buildingId: 'WAREHOUSE',
            buildingFieldId: 20,
            level: 4,
            reason: kind,
            reasonDetail:
              kind === 'missing-resources'
                ? { type: kind, missingResources: [100, 0, 50, 20] }
                : {
                    type: kind,
                    unmetRequirements: [
                      {
                        type: 'building',
                        buildingId: 'MAIN_BUILDING',
                        requiredLevel: 5,
                        currentLevel: 3,
                      },
                      { type: 'amount', amount: 2 },
                    ],
                  },
          };

          return {
            type: 'scheduledConstructionCancellation' as const,
            outcome: 'scheduledConstructionCancelled',
            table: 'scheduled_construction_cancellation_reports',
            id: insertScheduledConstructionCancellationReport(database, input),
            details: {
              summary: villageSummary,
              buildingId: input.buildingId,
              buildingFieldId: input.buildingFieldId,
              level: input.level,
              reason: input.reason,
              reasonDetail: input.reasonDetail,
            },
          };
        }
      }
    })();

    expect(reportCase.id).toBeDefined();
    const expected = {
      id: reportCase.id,
      ...commonInput,
      type: reportCase.type,
      outcome: reportCase.outcome,
      tags: [],
      ...reportCase.details,
    };
    const expectedListing =
      kind === 'villageFounded'
        ? {
            id: expected.id,
            ...commonInput,
            type: expected.type,
            outcome: expected.outcome,
            tags: [],
            summary: expected.summary,
          }
        : expected;

    setActiveReportFilters(database, [reportCase.type]);

    expect(
      getReports(database, createControllerArgs<'/reports'>({})),
    ).toStrictEqual([expectedListing]);

    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({
        path: { reportId: reportCase.id },
      }),
    );

    expect(report).toStrictEqual({ ...expected, tags: ['read'] });
    expect(
      getReports(database, createControllerArgs<'/reports'>({})),
    ).toStrictEqual([{ ...expectedListing, tags: ['read'] }]);

    deleteReports(
      database,
      createControllerArgs<'/reports', 'delete'>({ body: [reportCase.id] }),
    );

    expect(
      database.selectValue({
        sql: `SELECT COUNT(*) FROM ${reportCase.table} WHERE report_id = $id;`,
        bind: { $id: reportCase.id },
        schema: z.int(),
      }),
    ).toBe(0);
    expect(
      database.selectValue({
        sql: 'SELECT COUNT(*) FROM report_tags WHERE report_id = $id;',
        bind: { $id: reportCase.id },
        schema: z.int(),
      }),
    ).toBe(0);
    expect(
      database.selectValues({
        sql: 'SELECT id FROM reports ORDER BY id;',
        schema: z.int(),
      }),
    ).toStrictEqual(existingIds);
    expect(
      getReports(database, createControllerArgs<'/reports'>({})),
    ).toStrictEqual([]);
  });
});

const createScoutingIntelligenceFixture = (database: DbFacade) => {
  const villages = database.selectObjects({
    sql: `SELECT v.id, v.tile_id, v.player_id, v.name AS village_name,
      p.name AS player_name, p.slug AS player_slug, t.x, t.y
      FROM villages v JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id JOIN tiles t ON t.id = v.tile_id
      WHERE ti.tribe = 'romans' ORDER BY v.id LIMIT 4;`,
    schema: z.strictObject({
      id: z.int(),
      tile_id: z.int(),
      player_id: z.int(),
      village_name: z.string(),
      player_name: z.string(),
      player_slug: z.string(),
      x: z.int(),
      y: z.int(),
    }),
  });

  expect(villages).toHaveLength(4);

  const [origin, target, firstReinforcement, secondReinforcement] = villages;
  const input: Parameters<typeof insertScoutingReport>[1] = {
    villageId: origin.id,
    timestamp: 7000,
    outcome: 'scoutAttackerSomeLoss',
    originTileId: origin.tile_id,
    targetTileId: target.tile_id,
    perspective: 'attacker',
    successful: true,
    target: 'resources',
    attacker: {
      tribe: 'romans',
      units: [{ unitId: 'ROMAN_SCOUT', amountBefore: 10, amountAfter: 8 }],
    },
    defender: {
      tribe: 'romans',
      units: [{ unitId: 'ROMAN_SCOUT', amount: 20 }],
      reinforcements: [
        {
          tileId: firstReinforcement.tile_id,
          tribe: 'romans',
          units: [
            { unitId: 'LEGIONNAIRE', amount: 30 },
            { unitId: 'PRAETORIAN', amount: 15 },
          ],
        },
        {
          tileId: secondReinforcement.tile_id,
          tribe: 'romans',
          units: [{ unitId: 'LEGIONNAIRE', amount: 40 }],
        },
      ],
    },
    resources: { wood: 0, clay: 20, iron: 30, wheat: 40 },
    itemId: 1022,
    itemAmount: 1,
  };

  return { input, origin, target, firstReinforcement, secondReinforcement };
};

const readScoutingReport = (
  database: DbFacade,
  input: Parameters<typeof insertScoutingReport>[1],
) => {
  const reportId = insertScoutingReport(database, input);

  expect(reportId).toBeDefined();

  const report = getReport(
    database,
    createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
  );

  if (report?.type !== 'scouting') {
    throw new Error('Expected a scouting report');
  }

  return report;
};

describe('scouting intelligence reports', () => {
  test.each(['attacker', 'defender'] as const)(
    'round-trips successful resource intelligence and groups reinforcements for the %s',
    async (perspective) => {
      using database = await prepareReportsTestDatabase();
      const { input, origin, target, firstReinforcement, secondReinforcement } =
        createScoutingIntelligenceFixture(database);

      input.perspective = perspective;
      input.villageId = perspective === 'attacker' ? origin.id : target.id;
      input.outcome =
        perspective === 'attacker'
          ? 'scoutAttackerSomeLoss'
          : 'scoutDefenderSomeLoss';

      const report = readScoutingReport(database, input);

      expect(report.scouting).toMatchObject({
        perspective,
        successful: true,
        target: 'resources',
        resources: [0, 20, 30, 40],
        itemId: 1022,
        itemAmount: 1,
        defensiveStructures: [],
        attacker: input.attacker,
      });
      expect(report.scouting.defender.units).toStrictEqual(
        input.defender.units,
      );

      const expectedReinforcements = [
        firstReinforcement,
        secondReinforcement,
      ].map((village, index) => ({
        tribe: 'romans',
        player: { name: village.player_name, slug: village.player_slug },
        village: {
          name: village.village_name,
          coordinates: { x: village.x, y: village.y },
        },
        units: input.defender.reinforcements![index].units,
      }));

      expect(report.scouting.defender.reinforcements).toHaveLength(2);
      expect(report.scouting.defender.reinforcements).toEqual(
        expect.arrayContaining(
          expectedReinforcements.map((reinforcement) => ({
            ...reinforcement,
            units: expect.arrayContaining(reinforcement.units),
          })),
        ),
      );

      for (const reinforcement of report.scouting.defender.reinforcements) {
        const expected = expectedReinforcements.find(
          ({ village }) => village.name === reinforcement.village.name,
        )!;

        expect(reinforcement.units).toHaveLength(expected.units.length);
      }
    },
  );

  test('round-trips defensive structures without inventing resources or items', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createScoutingIntelligenceFixture(database);
    input.target = 'defensiveStructures';
    input.resources = undefined;
    input.itemId = null;
    input.itemAmount = null;
    input.defensiveStructures = [
      { buildingId: 'RESIDENCE', level: 10 },
      { buildingId: 'ROMAN_WALL', level: 6 },
    ];

    const report = readScoutingReport(database, input);

    expect(report.scouting.target).toBe('defensiveStructures');
    expect(report.scouting.defensiveStructures).toHaveLength(2);
    expect(report.scouting.defensiveStructures).toEqual(
      expect.arrayContaining(input.defensiveStructures),
    );
    expect(report.scouting.resources).toBeNull();
    expect(report.scouting.itemId).toBeNull();
    expect(report.scouting.itemAmount).toBeNull();
  });

  test('preserves known zero resources and empty reinforcement lists', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createScoutingIntelligenceFixture(database);
    input.resources = { wood: 0, clay: 0, iron: 0, wheat: 0 };
    input.itemId = null;
    input.itemAmount = null;
    input.defender.reinforcements = [];

    const report = readScoutingReport(database, input);

    expect(report.scouting.resources).toStrictEqual([0, 0, 0, 0]);
    expect(report.scouting.itemId).toBeNull();
    expect(report.scouting.itemAmount).toBeNull();
    expect(report.scouting.defender.reinforcements).toStrictEqual([]);
  });

  test.each(['resources', 'defensiveStructures'] as const)(
    'hides stored %s intelligence and reinforcements when scouting was unsuccessful',
    async (target) => {
      using database = await prepareReportsTestDatabase();
      const { input } = createScoutingIntelligenceFixture(database);
      input.target = target;
      input.successful = false;
      input.outcome = 'scoutAttackerFullLoss';
      input.attacker.units[0].amountAfter = 0;

      if (target === 'defensiveStructures') {
        input.resources = undefined;
        input.itemId = null;
        input.itemAmount = null;
        input.defensiveStructures = [{ buildingId: 'RESIDENCE', level: 10 }];
      }

      const report = readScoutingReport(database, input);

      expect(report.scouting.successful).toBe(false);
      expect(report.scouting.target).toBe(target);
      expect(report.scouting.attacker.units).toStrictEqual(
        input.attacker.units,
      );
      expect(report.scouting.defender.units).toStrictEqual(
        input.defender.units,
      );
      expect(report.scouting.resources).toBeNull();
      expect(report.scouting.itemId).toBeNull();
      expect(report.scouting.itemAmount).toBeNull();
      expect(report.scouting.defensiveStructures).toStrictEqual([]);
      expect(report.scouting.defender.reinforcements).toStrictEqual([]);
      expect(
        database.selectValue({
          sql: `SELECT COUNT(*) FROM scouting_report_units WHERE scouting_report_id = $id AND role = 'reinforcement';`,
          bind: { $id: report.scouting.id },
          schema: z.int(),
        }),
      ).toBe(3);

      if (target === 'resources') {
        expect(
          database.selectObject({
            sql: 'SELECT wood, clay, iron, wheat, item_id, item_amount FROM scouting_reports WHERE id = $id;',
            bind: { $id: report.scouting.id },
            schema: z.strictObject({
              wood: z.int(),
              clay: z.int(),
              iron: z.int(),
              wheat: z.int(),
              item_id: z.int(),
              item_amount: z.int(),
            }),
          }),
        ).toStrictEqual({
          wood: 0,
          clay: 20,
          iron: 30,
          wheat: 40,
          item_id: 1022,
          item_amount: 1,
        });
      } else {
        expect(
          database.selectValue({
            sql: 'SELECT COUNT(*) FROM scouting_report_structures WHERE scouting_report_id = $id;',
            bind: { $id: report.scouting.id },
            schema: z.int(),
          }),
        ).toBe(1);
      }
    },
  );
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
    siegeResults: [
      {
        fieldId: 20,
        requestedBuildingId: 'WAREHOUSE',
        buildingId: 'WAREHOUSE',
        targeting: 'selected',
        outcome: 'damaged',
        reason: null,
        levelBefore: 20,
        levelAfter: 12,
      },
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

  const reportId = insertBattleReport(database, input);

  if (reportId === undefined) {
    throw new Error('Expected battle report generation to be enabled');
  }

  return { input, reportId };
};

describe('battle combat outcome reports', () => {
  test.each([0, 1, 2, 3])(
    'redacts battle information according to reporting village %s, independently of player ownership',
    async (ownerIndex) => {
      using database = await prepareReportsTestDatabase();
      const villages = database.selectObjects({
        sql: 'SELECT id, tile_id, player_id FROM villages ORDER BY id LIMIT 4;',
        schema: z.strictObject({
          id: z.int(),
          tile_id: z.int(),
          player_id: z.int(),
        }),
      });
      database.exec({
        sql: 'UPDATE villages SET player_id = $player_id WHERE id IN (SELECT value FROM json_each($ids));',
        bind: {
          $player_id: villages[0].player_id,
          $ids: JSON.stringify(villages.map(({ id }) => id)),
        },
      });
      const { input } = createCombatOutcomeReport(database);
      input.villageId = villages[ownerIndex].id;
      input.outcome =
        ownerIndex === 0 ? 'attackerFullLoss' : 'defenderSomeLoss';
      input.conquest = {
        target: 'village',
        succeeded: false,
        failureReason: 'defenders-survived',
      };
      input.loyaltyAfter = input.loyaltyBefore;
      input.attacker.units[0] = {
        ...input.attacker.units[0],
        amountAfter: 0,
        amountHospitalized: 0,
        amountBandaged: 0,
        amountImprisoned: 0,
      };
      input.attacker.hero!.healthAfter = 0;
      input.defender.units = [
        {
          ...input.attacker.units[0],
          amountAfter: 70,
          amountHospitalized: 10,
          amountBandaged: 5,
          amountImprisoned: 5,
        },
      ];
      input.reinforcements[0].units = [{ ...input.defender.units[0] }];
      input.reinforcements.push({
        playerId: villages[0].player_id,
        tileId: villages[3].tile_id,
        units: [{ ...input.defender.units[0] }],
        hero: { ...input.reinforcements[0].hero!, heroId: 7004 },
      });
      const reportId = insertBattleReport(database, input);
      const result = getReport(
        database,
        createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
      );
      if (result?.type !== 'battle') {
        throw new Error('Expected a battle report');
      }
      // Check the serializable response, not just presentation flags.
      const report: typeof result = JSON.parse(JSON.stringify(result));
      const canSeeDefenders = ownerIndex === 1;

      expect(report.villageId).toBe(villages[ownerIndex].id);
      expect(
        report.battle.defender.reinforcements.map(({ village }) => village.id),
      ).toStrictEqual(
        canSeeDefenders
          ? [villages[2].id, villages[3].id]
          : ownerIndex >= 2
            ? [villages[ownerIndex].id]
            : [],
      );
      expect(report.battle.defender.troops.units).toEqual(
        canSeeDefenders ? input.defender.units : null,
      );
      expect(report.battle.attacker.troops.units).not.toBeNull();

      for (const participant of [
        report.battle.attacker,
        report.battle.defender,
        ...report.battle.defender.reinforcements,
      ]) {
        const isOwn = participant.village.id === report.villageId;
        const original = [
          input.attacker,
          input.defender,
          ...input.reinforcements,
        ].find(({ tileId }) => tileId === participant.village.tileId)!;

        expect(participant.troops.hero).toStrictEqual(
          isOwn ? original.hero : null,
        );
        if (participant.troops.units !== null) {
          expect(participant.troops.units).toHaveLength(original.units.length);
          for (const [index, unit] of participant.troops.units.entries()) {
            expect(unit).toStrictEqual({
              ...original.units[index],
              amountHospitalized: isOwn
                ? original.units[index].amountHospitalized
                : null,
              amountBandaged: isOwn
                ? original.units[index].amountBandaged
                : null,
            });
          }
        }
      }
      if (canSeeDefenders) {
        expect(report.battle.statistics.defender).not.toBeNull();
        expect(report.battle.siegeResults).toStrictEqual(input.siegeResults);
        expect(report.battle.outcome.conquest).toStrictEqual(input.conquest);
      } else {
        expect(report.battle.statistics.defender).toBeNull();
        expect(report.battle.siegeResults).toBeNull();
        expect(report.battle.outcome).toStrictEqual({
          loot: input.loot,
          totalCarryCapacity: 0,
          loyaltyBefore: null,
          loyaltyAfter: null,
          conquest: null,
          villageDestroyed: null,
          trapsDestroyed: null,
          rescuedUnits: null,
          capturedAnimals: null,
          stolenItems: null,
        });
      }
      expect(
        database.selectValue({
          sql: `SELECT COUNT(*) FROM battle_report_heroes h
          JOIN battle_report_participants p ON p.id = h.battle_participant_id
          JOIN battle_reports b ON b.id = p.battle_id WHERE b.report_id = $report_id;`,
          bind: { $report_id: reportId },
          schema: z.int(),
        }),
      ).toBe(4);
    },
  );

  test('reveals defending troop counts to a surviving attacker while withholding defender recovery and heroes', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createCombatOutcomeReport(database);
    input.defender.units = [{ ...input.attacker.units[0] }];
    const id = insertBattleReport(database, input);
    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({ path: { reportId: id } }),
    );

    if (report?.type !== 'battle') {
      throw new Error('Expected a battle report');
    }
    expect(report.battle.defender.troops.units).toStrictEqual([
      {
        ...input.defender.units[0],
        amountHospitalized: null,
        amountBandaged: null,
      },
    ]);
    expect(report.battle.defender.troops.hero).toBeNull();
    expect(report.battle.defender.reinforcements).toHaveLength(1);
    expect(report.battle.defender.reinforcements[0].troops.hero).toBeNull();
    expect(report.battle.statistics.defender).not.toBeNull();
    expect(report.battle.siegeResults).toStrictEqual(input.siegeResults);
  });

  test.each([
    { defendingDeaths: 24, visible: false },
    { defendingDeaths: 25, visible: true },
  ])(
    'applies the defending-troop visibility threshold at $defendingDeaths percent killed',
    async ({ defendingDeaths, visible }) => {
      using database = await prepareReportsTestDatabase();
      const { input } = createCombatOutcomeReport(database);
      input.outcome = 'attackerFullLoss';
      input.conquest = null;
      input.loyaltyBefore = null;
      input.loyaltyAfter = null;
      input.attacker.units = [
        {
          ...input.attacker.units[0],
          amountAfter: 0,
          amountHospitalized: 0,
          amountImprisoned: 0,
          amountBandaged: 0,
        },
      ];
      input.attacker.hero = null;
      input.defender.units = [
        { ...input.attacker.units[0], amountAfter: 100 - defendingDeaths },
      ];
      const reportId = insertBattleReport(database, input);
      const report = getReport(
        database,
        createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
      );

      if (report?.type !== 'battle') {
        throw new Error('Expected a battle report');
      }

      expect(report.battle.defender.troops.units).toStrictEqual(
        visible
          ? [
              {
                ...input.defender.units[0],
                amountHospitalized: null,
                amountBandaged: null,
              },
            ]
          : null,
      );
      expect(report.battle.defender.reinforcements).toHaveLength(
        visible ? 1 : 0,
      );
      expect(report.battle.statistics.defender === null).toBe(!visible);
      expect(report.battle.siegeResults).toStrictEqual(
        visible ? input.siegeResults : null,
      );
    },
  );

  test('retention prunes the oldest tied report and its details while preserving archived reports', async () => {
    using database = await prepareReportsTestDatabase();

    database.exec({ sql: 'DELETE FROM reports;' });

    const archived = createCombatOutcomeReport(database);
    const oldest = createCombatOutcomeReport(database);
    const newer = createCombatOutcomeReport(database);

    updateReports(
      database,
      createControllerArgs<'/reports', 'patch'>({
        body: { reportIds: [archived.reportId], tags: { archived: true } },
      }),
    );

    const readReport = (reportId: number) =>
      getReport(
        database,
        createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
      );
    const archivedBefore = readReport(archived.reportId);
    const newerBefore = readReport(newer.reportId);
    const tables = [
      'battle_reports',
      'battle_report_participants',
      'battle_report_units',
      'battle_report_buildings',
      'battle_report_heroes',
      'battle_report_consumables',
      'battle_report_conquests',
      'battle_report_rescues',
      'battle_report_rescued_units',
      'battle_report_captured_animals',
      'battle_report_stolen_items',
    ];
    const detailCounts = () =>
      tables.map(
        (table) =>
          database.selectValue({
            sql: `SELECT COUNT(*) FROM ${table};`,
            schema: z.int(),
          })!,
      );
    const before = detailCounts();

    for (const count of before) {
      expect(count).toBeGreaterThan(0);
    }

    const addAdventure = (timestamp: number) =>
      insertAdventureReport(database, {
        villageId: archived.input.villageId,
        timestamp,
        adventureId: 1,
        itemId: null,
        itemAmount: null,
        healthBefore: 100,
        healthAfter: 95,
      });

    for (let i = 0; i < 998; i += 1) {
      expect(addAdventure(6000 + i)).toBeDefined();
    }

    expect(detailCounts()).toStrictEqual(before);
    expect(readReport(oldest.reportId)).not.toBeNull();

    expect(addAdventure(7000)).toBeDefined();

    expect(readReport(oldest.reportId)).toBeNull();
    expect(readReport(archived.reportId)).toStrictEqual(archivedBefore);
    expect(readReport(newer.reportId)).toStrictEqual(newerBefore);
    expect(detailCounts()).toStrictEqual(
      before.map((count) => (count / 3) * 2),
    );
    expect(
      database.selectValue({
        sql: 'SELECT COUNT(*) FROM report_tags WHERE report_id = $report_id;',
        bind: { $report_id: oldest.reportId },
        schema: z.int(),
      }),
    ).toBe(0);
    expect(
      database.selectValue({
        sql: 'SELECT COUNT(*) FROM reports;',
        schema: z.int(),
      }),
    ).toBe(1001);
  });

  test('deleting a selected battle leaves unselected reports and their details unchanged', async () => {
    using database = await prepareReportsTestDatabase();
    const first = createCombatOutcomeReport(database);
    const selected = createCombatOutcomeReport(database);
    const last = createCombatOutcomeReport(database);
    const readReport = (reportId: number) =>
      getReport(
        database,
        createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
      );
    const firstBefore = readReport(first.reportId);
    const lastBefore = readReport(last.reportId);
    const reportIds = () =>
      database.selectValues({
        sql: 'SELECT id FROM reports ORDER BY id;',
        schema: z.int(),
      });
    const before = reportIds();

    deleteReports(
      database,
      createControllerArgs<'/reports', 'delete'>({ body: [selected.reportId] }),
    );

    expect(reportIds()).toStrictEqual(
      before.filter((id) => id !== selected.reportId),
    );
    expect(readReport(selected.reportId)).toBeNull();
    expect(readReport(first.reportId)).toStrictEqual(firstBefore);
    expect(readReport(last.reportId)).toStrictEqual(lastBefore);
  });

  test('aggregates repeated special outcomes without combining different items, villages, or heroes', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createCombatOutcomeReport(database);
    const rescue = input.rescuedUnits[0];
    const otherRescue = {
      ...rescue,
      playerId: input.attacker.playerId!,
      homeTileId: input.originTileId,
      amountFreed: 4,
      amountDied: 1,
    };

    input.rescuedUnits.push(
      { ...rescue, amountFreed: 10, amountDied: 2 },
      otherRescue,
    );
    input.capturedAnimals.push(
      { unitId: 'RAT', amount: 2 },
      { unitId: 'SPIDER', amount: 4 },
    );
    input.stolenItems.push({ itemId: 1021, amount: 2 });
    input.attacker.hero!.consumables.push(
      { itemId: 1023, amount: 2 },
      { itemId: 1021, amount: 1 },
    );
    input.defender.hero!.consumables = [{ itemId: 1023, amount: 1 }];
    input.reinforcements[0].hero!.consumables.push(
      { itemId: 1023, amount: 4 },
      { itemId: 1023, amount: 2 },
    );

    const reportId = insertBattleReport(database, input);
    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
    );
    if (report?.type !== 'battle') {
      throw new Error('Expected a battle report');
    }

    expect(report.battle.outcome.rescuedUnits).toHaveLength(2);
    expect(report.battle.outcome.rescuedUnits).toEqual(
      expect.arrayContaining([
        { ...rescue, amountFreed: 30, amountDied: 7 },
        otherRescue,
      ]),
    );
    expect(report.battle.outcome.capturedAnimals).toHaveLength(2);
    expect(report.battle.outcome.capturedAnimals).toEqual(
      expect.arrayContaining([
        { unitId: 'RAT', amount: 5 },
        { unitId: 'SPIDER', amount: 4 },
      ]),
    );
    expect(report.battle.outcome.stolenItems).toHaveLength(2);
    expect(report.battle.outcome.stolenItems).toEqual(
      expect.arrayContaining([
        { itemId: 10001, amount: 1 },
        { itemId: 1021, amount: 5 },
      ]),
    );
    expect(
      report.battle.attacker.troops.hero?.consumables.toSorted(
        (a, b) => a.itemId - b.itemId,
      ),
    ).toEqual([
      { itemId: 1021, amount: 1 },
      { itemId: 1023, amount: 5 },
    ]);
    const readOwnerCopy = (tileId: number) => {
      const villageId = database.selectValue({
        sql: 'SELECT id FROM villages WHERE tile_id = $tile_id;',
        bind: { $tile_id: tileId },
        schema: z.int(),
      })!;
      const ownerReportId = insertBattleReport(database, {
        ...input,
        villageId,
      });
      const ownerReport = getReport(
        database,
        createControllerArgs<'/reports/:reportId'>({
          path: { reportId: ownerReportId },
        }),
      );
      if (ownerReport?.type !== 'battle') {
        throw new Error('Expected a battle report');
      }
      return ownerReport;
    };
    const defenderReport = readOwnerCopy(input.targetTileId);
    const reinforcementReport = readOwnerCopy(input.reinforcements[0].tileId);

    expect(defenderReport.battle.defender.troops.hero?.consumables).toEqual([
      { itemId: 1023, amount: 1 },
    ]);
    expect(
      reinforcementReport.battle.defender.reinforcements[0].troops.hero?.consumables.toSorted(
        (a, b) => a.itemId - b.itemId,
      ),
    ).toEqual([
      { itemId: 1021, amount: 2 },
      { itemId: 1023, amount: 6 },
    ]);
  });

  test('round-trips distinct fields, randomized targets, and unsuccessful siege shots in order', async () => {
    using database = await prepareReportsTestDatabase();
    const { input } = createCombatOutcomeReport(database);
    const hit: BattleSiegeResult = {
      fieldId: 20,
      requestedBuildingId: 'WAREHOUSE',
      buildingId: 'WAREHOUSE',
      targeting: 'selected',
      outcome: 'damaged',
      reason: null,
      levelBefore: 20,
      levelAfter: 12,
    };
    input.siegeResults = [
      hit,
      { ...hit, fieldId: 21 },
      {
        ...hit,
        fieldId: 22,
        targeting: 'brewery',
        buildingId: 'GRANARY',
        outcome: 'destroyed',
        levelAfter: 0,
      },
      {
        ...hit,
        outcome: 'undamaged',
        reason: 'insufficient-power',
        levelAfter: 20,
      },
      {
        ...hit,
        outcome: 'not-fired',
        reason: 'no-surviving-siege',
        levelAfter: 20,
      },
      {
        ...hit,
        fieldId: null,
        buildingId: null,
        levelBefore: null,
        levelAfter: null,
        targeting: 'fallback',
        outcome: 'no-target',
        reason: 'target-missing',
      },
      {
        ...hit,
        fieldId: null,
        buildingId: null,
        levelBefore: null,
        levelAfter: null,
        outcome: 'not-fired',
        reason: 'raid',
      },
    ];

    const reportId = insertBattleReport(database, input);
    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({ path: { reportId } }),
    );
    expect(report).toHaveProperty('battle.siegeResults', input.siegeResults);
  });

  test('writes outcomes inside an existing event transaction', async () => {
    using database = await prepareReportsTestDatabase();

    expect(() =>
      database.transaction((tx) => {
        createCombatOutcomeReport(tx);
      }),
    ).not.toThrow();
  });

  test('round trips special outcomes and the owner hero without changing live game state', async () => {
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
    expect(report.battle.siegeResults).toStrictEqual(input.siegeResults);
    expect(report.battle.attacker.troops.units).toEqual(
      expect.arrayContaining(input.attacker.units),
    );
    expect(report.battle.attacker.troops.hero).toStrictEqual(
      input.attacker.hero,
    );
    expect(report.battle.defender.troops.hero).toBeNull();
    expect(report.battle.defender.reinforcements[0].troops.hero).toBeNull();
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
    input.defender = {
      playerId: null,
      tileId: input.targetTileId,
      units: [],
      hero: null,
    };
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
