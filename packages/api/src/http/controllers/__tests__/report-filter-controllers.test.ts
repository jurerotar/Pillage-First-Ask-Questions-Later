import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { reportListingFilterSchema } from '@pillage-first/types/dtos/report';
import {
  getReportFilters,
  updateReportFilters,
} from '../report-filter-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('report-filter-controllers', () => {
  test('getReportFilters should return active report filters', async () => {
    const database = await prepareTestDatabase();

    const filters = getReportFilters(
      database,
      createControllerArgs<'/players/:playerId/report-filters'>({
        path: { playerId: 1 },
      }),
    );

    expect(filters).toStrictEqual(
      [...reportListingFilterSchema.options].sort(),
    );
  });

  test('updateReportFilters should replace active report filters', async () => {
    const database = await prepareTestDatabase();

    updateReportFilters(
      database,
      createControllerArgs<'/players/:playerId/report-filters', 'patch'>({
        path: { playerId: 1 },
        body: { filters: ['battle', 'unitResearch', 'unitImprovement'] },
      }),
    );

    const filters = getReportFilters(
      database,
      createControllerArgs<'/players/:playerId/report-filters'>({
        path: { playerId: 1 },
      }),
    );

    expect(filters).toStrictEqual([
      'battle',
      'unitImprovement',
      'unitResearch',
    ]);
  });
});
