import { snakeCase } from 'moderndash';
import { createController } from '../utils/controller';
import { getMapFiltersSchema } from './schemas/map-filters-schemas';

export const getMapFilters = createController('/players/:playerId/map-filters')(
  ({ database }) => {
    return database.selectObject({
      sql: `
    SELECT
      should_show_faction_reputation,
      should_show_oasis_icons,
      should_show_troop_movements,
      should_show_wheat_fields,
      should_show_tile_tooltips,
      should_show_treasure_icons
    FROM map_filters`,
      schema: getMapFiltersSchema,
    })!;
  },
);

export const updateMapFilter = createController(
  '/players/:playerId/map-filters/:filterName',
  'patch',
)(({ database, path: { filterName }, body: { value } }) => {
  const column = snakeCase(filterName);

  database.exec({
    sql: `
    UPDATE map_filters
      SET ${column} = $value
    `,
    bind: {
      $value: value,
    },
  });
});
