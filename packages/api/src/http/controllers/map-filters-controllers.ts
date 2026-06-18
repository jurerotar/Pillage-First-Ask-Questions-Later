import { snakeCase } from 'moderndash';
import { z } from 'zod';
import { mapFiltersDtoSchema } from '@pillage-first/types/dtos/map-filters';
import {
  createUpdateMapFilterQuery,
  selectMapFiltersQuery,
} from '../../queries/map-filter-queries';
import { createController } from '../controller';
import { mapMapFiltersRowToDto } from './mappers/map-filters-mapper';
import { getMapFiltersRowSchema } from './schemas/map-filters-schemas';

export const getMapFilters = createController(
  '/players/:playerId/map-filters',
  {
    summary: 'Get map filters',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: mapFiltersDtoSchema,
  },
)(({ database }) => {
  const row = database.selectObject({
    sql: selectMapFiltersQuery,
    schema: getMapFiltersRowSchema,
  })!;

  return mapMapFiltersRowToDto(row);
});

export const updateMapFilter = createController(
  '/players/:playerId/map-filters/:filterName',
  'patch',
  {
    summary: 'Update map filter',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
        filterName: z.string(),
      }),
    },
    requestBody: z.strictObject({
      value: z.boolean(),
    }),
  },
)(({ database, path: { filterName }, body: { value } }) => {
  const column = snakeCase(filterName);

  database.exec({
    sql: createUpdateMapFilterQuery(column),
    bind: {
      $value: value ? 1 : 0,
    },
  });
});
