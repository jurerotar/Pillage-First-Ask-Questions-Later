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

export const getMapFilters = createController('/me/map-filters', {
  summary: 'Get map filters',
  response: mapFiltersDtoSchema,
})(({ database, context: { playerId } }) => {
  const row = database.selectObject({
    sql: selectMapFiltersQuery,
    bind: { $player_id: playerId },
    schema: getMapFiltersRowSchema,
  })!;

  return mapMapFiltersRowToDto(row);
});

export const updateMapFilter = createController(
  '/me/map-filters/:filterName',
  'patch',
  {
    summary: 'Update map filter',
    requestParams: {
      path: z.strictObject({
        filterName: mapFiltersDtoSchema.keyof(),
      }),
    },
    requestBody: z.strictObject({
      value: z.boolean(),
    }),
  },
)(
  ({
    database,
    context: { playerId },
    path: { filterName },
    body: { value },
  }) => {
    const column = snakeCase(filterName);

    database.exec({
      sql: createUpdateMapFilterQuery(column),
      bind: {
        $player_id: playerId,
        $value: value ? 1 : 0,
      },
    });
  },
);
