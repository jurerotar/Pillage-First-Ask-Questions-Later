import type { ApiHandler } from 'app/interfaces/api';
import { snakeCase } from 'moderndash';
import { z } from 'zod';

const getMapFiltersResponseSchema = z
  .strictObject({
    should_show_faction_reputation: z.boolean(),
    should_show_oasis_icons: z.boolean(),
    should_show_troop_movements: z.boolean(),
    should_show_wheat_fields: z.boolean(),
    should_show_tile_tooltips: z.boolean(),
    should_show_treasure_icons: z.boolean(),
  })
  .transform((t) => {
    return {
      shouldShowFactionReputation: t.should_show_faction_reputation,
      shouldShowOasisIcons: t.should_show_oasis_icons,
      shouldShowTileTooltips: t.should_show_tile_tooltips,
      shouldShowTreasureIcons: t.should_show_treasure_icons,
      shouldShowTroopMovements: t.should_show_troop_movements,
      shouldShowWheatFields: t.should_show_wheat_fields,
    };
  });

export const getMapFilters: ApiHandler<z.infer<typeof getMapFiltersResponseSchema>> = async (
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
  );

  return getMapFiltersResponseSchema.parse(row);
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
