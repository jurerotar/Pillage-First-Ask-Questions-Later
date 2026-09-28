import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  reportFilterNameByScope,
  reportListingFilterSchema,
} from '@pillage-first/types/dtos/report';
import { getFilters, updateFilters } from '../filter-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('filter-controllers', () => {
  test('getFilters should return active filters by name', async () => {
    const database = await prepareTestDatabase();

    const filters = getFilters(
      database,
      createControllerArgs<'/players/:playerId/filters/:name'>({
        path: { playerId: 1, name: reportFilterNameByScope.global },
      }),
    );

    expect(filters).toStrictEqual(
      [...reportListingFilterSchema.options].sort(),
    );
  });

  test('updateFilters should replace active filters for the requested name', async () => {
    const database = await prepareTestDatabase();

    updateFilters(
      database,
      createControllerArgs<'/players/:playerId/filters/:name', 'patch'>({
        path: { playerId: 1, name: reportFilterNameByScope.global },
        body: { filters: ['battle', 'unitResearch', 'unitImprovement'] },
      }),
    );

    const filters = getFilters(
      database,
      createControllerArgs<'/players/:playerId/filters/:name'>({
        path: { playerId: 1, name: reportFilterNameByScope.global },
      }),
    );

    expect(filters).toStrictEqual([
      'battle',
      'unitImprovement',
      'unitResearch',
    ]);
  });

  test('updateFilters should only update the requested filter group', async () => {
    const database = await prepareTestDatabase();

    updateFilters(
      database,
      createControllerArgs<'/players/:playerId/filters/:name', 'patch'>({
        path: { playerId: 1, name: reportFilterNameByScope.unread },
        body: { filters: ['battle'] },
      }),
    );

    const unreadFilters = getFilters(
      database,
      createControllerArgs<'/players/:playerId/filters/:name'>({
        path: { playerId: 1, name: reportFilterNameByScope.unread },
      }),
    );
    const globalFilters = getFilters(
      database,
      createControllerArgs<'/players/:playerId/filters/:name'>({
        path: { playerId: 1, name: reportFilterNameByScope.global },
      }),
    );

    expect(unreadFilters).toStrictEqual(['battle']);
    expect(globalFilters).toStrictEqual(
      [...reportListingFilterSchema.options].sort(),
    );
  });

  test('updateFilters should ignore duplicate filters', async () => {
    const database = await prepareTestDatabase();

    updateFilters(
      database,
      createControllerArgs<'/players/:playerId/filters/:name', 'patch'>({
        path: { playerId: 1, name: reportFilterNameByScope.global },
        body: { filters: ['battle', 'battle'] },
      }),
    );

    const filters = getFilters(
      database,
      createControllerArgs<'/players/:playerId/filters/:name'>({
        path: { playerId: 1, name: reportFilterNameByScope.global },
      }),
    );

    expect(filters).toStrictEqual(['battle']);
  });
});
