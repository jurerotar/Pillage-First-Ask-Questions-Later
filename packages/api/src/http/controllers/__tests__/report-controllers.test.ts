import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { getReports, updateReports } from '../report-controllers';
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
});
