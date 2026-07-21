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

describe('report-controllers', () => {
  test('should list reports and filter by one or multiple report types', async () => {
    const database = await prepareTestDatabase();

    const allReports = getReports(
      database,
      createControllerArgs<'/players/:playerId/reports'>({
        path: { playerId: 1 },
      }),
    );

    expect(allReports).toHaveLength(100);

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
      createControllerArgs<'/players/:playerId/reports'>({
        path: { playerId: 1 },
        query: { types: 'huntingParty' },
      }),
    );

    expect(huntingReports).toHaveLength(10);
    expect(huntingReports.every(({ type }) => type === 'huntingParty')).toBe(
      true,
    );

    const expeditionReports = getReports(
      database,
      createControllerArgs<'/players/:playerId/reports'>({
        path: { playerId: 1 },
        query: { types: ['huntingParty', 'gatheringExpedition'] },
      }),
    );

    expect(expeditionReports).toHaveLength(20);
    expect(
      expeditionReports.every(
        ({ type }) => type === 'huntingParty' || type === 'gatheringExpedition',
      ),
    ).toBe(true);
  });

  test('should apply unread, archived, and village scopes', async () => {
    const database = await prepareTestDatabase();

    const unreadReports = getReports(
      database,
      createControllerArgs<'/players/:playerId/reports'>({
        path: { playerId: 1 },
        query: { scope: 'unread' },
      }),
    );

    expect(unreadReports.length).toBeGreaterThan(0);
    expect(unreadReports.every(({ tags }) => !tags.includes('read'))).toBe(
      true,
    );

    const archivedReports = getReports(
      database,
      createControllerArgs<'/players/:playerId/reports'>({
        path: { playerId: 1 },
        query: { scope: 'archived' },
      }),
    );

    expect(archivedReports.length).toBeGreaterThan(0);
    expect(archivedReports.every(({ tags }) => tags.includes('archived'))).toBe(
      true,
    );

    const villageReports = getReports(
      database,
      createControllerArgs<'/players/:playerId/reports'>({
        path: { playerId: 1 },
        query: { scope: 'village', villageId: 1 },
      }),
    );

    expect(villageReports.length).toBeGreaterThan(0);
    expect(villageReports.every(({ villageId }) => villageId === 1)).toBe(true);
  });

  test('should return complete detail DTOs for every report type', async () => {
    const database = await prepareTestDatabase();

    const reportIds = database.selectObjects({
      sql: `SELECT rti.report_type AS type, MIN(r.id) AS id FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id GROUP BY rti.report_type;`,
      schema: z.strictObject({ type: z.string(), id: z.int() }),
    });

    const reports = reportIds.map(({ id }) =>
      getReport(
        database,
        createControllerArgs<'/report/:playerId/:reportId'>({
          path: { playerId: 1, reportId: id },
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

  test('should reject missing reports and reports owned by another player', async () => {
    const database = await prepareTestDatabase();

    const reportId = database.selectValue({
      sql: 'SELECT MIN(id) FROM reports;',
      schema: z.int(),
    })!;

    expect(() =>
      getReport(
        database,
        createControllerArgs<'/report/:playerId/:reportId'>({
          path: { playerId: 2, reportId },
        }),
      ),
    ).toThrow(`Report ${reportId} not found for player 2`);

    expect(() =>
      getReport(
        database,
        createControllerArgs<'/report/:playerId/:reportId'>({
          path: { playerId: 1, reportId: -1 },
        }),
      ),
    ).toThrow('Report -1 not found for player 1');
  });

  test('should update tags for multiple reports to their requested state', async () => {
    const database = await prepareTestDatabase();

    const reports = getReports(
      database,
      createControllerArgs<'/players/:playerId/reports'>({
        path: { playerId: 1 },
      }),
    );

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
      createControllerArgs<'/players/:playerId/reports'>({
        path: { playerId: 1 },
      }),
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
      createControllerArgs<'/players/:playerId/reports'>({
        path: { playerId: 1 },
      }),
    ).filter(({ id }) => reportIds.includes(id));

    expect(updatedReports.every(({ tags }) => !tags.includes('read'))).toBe(
      true,
    );
    expect(updatedReports.every(({ tags }) => tags.includes('archived'))).toBe(
      true,
    );
  });

  test('should delete hunting party and gathering expedition details', async () => {
    const database = await prepareTestDatabase();

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
    const database = await prepareTestDatabase();
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
});
