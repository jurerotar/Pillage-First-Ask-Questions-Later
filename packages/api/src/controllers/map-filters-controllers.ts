import { snakeCase } from 'moderndash';
import { createController } from '../http/controller';
import { mapMapFiltersRowToDto } from '../mappers/map-filters-mapper';
import {
  createUpdateMapFilterQuery,
  selectMapFiltersQuery,
} from '../queries/map-filter-queries';
import { getMapFiltersRowSchema } from '../schemas/map-filters-schemas';

export const getMapFilters = createController('/players/:playerId/map-filters')(
  ({ database }) => {
    const row = database.selectObject({
      sql: selectMapFiltersQuery,
      schema: getMapFiltersRowSchema,
    })!;

    return mapMapFiltersRowToDto(row);
  },
);

export const updateMapFilter = createController(
  '/players/:playerId/map-filters/:filterName',
  'patch',
)(({ database, path: { filterName }, body: { value } }) => {
  const column = snakeCase(filterName);

  database.exec({
    sql: createUpdateMapFilterQuery(column),
    bind: {
      $value: value ? 1 : 0,
    },
  });
});
