import { z } from 'zod';
import {
  reportFiltersDtoSchema,
  reportListingFilterSchema,
} from '@pillage-first/types/dtos/report';
import {
  selectActiveReportFiltersQuery,
  updateReportFiltersQuery,
} from '../../queries/report-filter-queries';
import { createController } from '../controller';

export const getReportFilters = createController(
  '/players/:playerId/report-filters',
  {
    summary: 'Get report filters',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: reportFiltersDtoSchema,
  },
)(({ database, path: { playerId } }) => {
  return database.selectValues({
    sql: selectActiveReportFiltersQuery,
    bind: { $player_id: playerId },
    schema: reportListingFilterSchema,
  });
});

export const updateReportFilters = createController(
  '/players/:playerId/report-filters',
  'patch',
  {
    summary: 'Update report filters',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    requestBody: z.strictObject({
      filters: reportFiltersDtoSchema,
    }),
  },
)(({ database, path: { playerId }, body: { filters } }) => {
  database.exec({
    sql: updateReportFiltersQuery,
    bind: {
      $player_id: playerId,
      $filters: JSON.stringify(filters),
    },
  });
});
