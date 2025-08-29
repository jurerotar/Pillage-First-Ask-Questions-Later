import type { ApiHandler } from 'app/interfaces/api';
import type {
  MapFilters,
  MapFiltersModel,
} from 'app/interfaces/models/game/map-filters';
import { snakeCase } from 'moderndash';
import { mapFiltersApiResource } from 'app/(game)/api/api-resources/map-filters-api-resources';

export const getMapFilters: ApiHandler<MapFilters> = async (
  _queryClient,
  database,
) => {
  const row = database.selectObject(
    `
    SELECT
      should_show_faction_reputation,
      should_show_oasis_icons,
      should_show_troop_movements,
      should_show_wheat_fields,
      should_show_tile_tooltips,
      should_show_treasure_icons
    FROM map_filters`,
  ) as unknown as MapFiltersModel;

  return mapFiltersApiResource(row);
};

type UpdateMapFilterBody = {
  value: boolean;
};

export const updateMapFilter: ApiHandler<
  void,
  'filterName',
  UpdateMapFilterBody
> = async (_queryClient, database, { params, body }) => {
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
