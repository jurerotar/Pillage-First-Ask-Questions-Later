import { snakeCase } from 'moderndash';
import type { Controller } from '../types/controller';
import { getMapFiltersSchema } from './schemas/map-filters-schemas.ts';

/**
 * GET /players/:playerId/map-filters
 */
export const getMapFilters: Controller<'/players/:playerId/map-filters'> = (
  database,
) => {
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
};

type UpdateMapFilterBody = {
  value: boolean;
};

/**
 * PATCH /players/:playerId/map-filters/:filterName
 * @pathParam {string} filterName
 * @bodyContent application/json UpdateMapFilterBody
 * @bodyRequired
 */
export const updateMapFilter: Controller<
  '/players/:playerId/map-filters/:filterName',
  'patch',
  UpdateMapFilterBody
> = (database, { params, body }) => {
  const { filterName } = params;
  const { value } = body;

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
};
