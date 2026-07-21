import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  deleteReports,
  getReports,
  updateReports,
} from '../report-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('report-controllers', () => {
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
});
