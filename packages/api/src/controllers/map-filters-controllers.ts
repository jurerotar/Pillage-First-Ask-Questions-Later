import { snakeCase } from 'moderndash';
import { z } from 'zod';
import type { Controller } from '../types/controller';

const getMapFiltersSchema = z
  .strictObject({
    should_show_faction_reputation: z.number(),
    should_show_oasis_icons: z.number(),
    should_show_troop_movements: z.number(),
    should_show_wheat_fields: z.number(),
    should_show_tile_tooltips: z.number(),
    should_show_treasure_icons: z.number(),
  })
  .transform((t) => {
    return {
      shouldShowFactionReputation: Boolean(t.should_show_faction_reputation),
      shouldShowOasisIcons: Boolean(t.should_show_oasis_icons),
      shouldShowTileTooltips: Boolean(t.should_show_tile_tooltips),
      shouldShowTreasureIcons: Boolean(t.should_show_treasure_icons),
      shouldShowTroopMovements: Boolean(t.should_show_troop_movements),
      shouldShowWheatFields: Boolean(t.should_show_wheat_fields),
    };
  });

/**
 * GET /map-filters
 */
export const getMapFilters: Controller<'/map-filters'> = (database) => {
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

  return getMapFiltersSchema.parse(row);
};

type UpdateMapFilterBody = {
  value: boolean;
};

/**
 * PATCH /map-filters/:filterName
 * @pathParam {string} filterName
 * @bodyContent application/json UpdateMapFilterBody
 * @bodyRequired
 */
export const updateMapFilter: Controller<
  '/map-filters/:filterName',
  'patch',
  UpdateMapFilterBody
> = (database, { params, body }) => {
  const { filterName } = params;
  const { value } = body;

  const column = snakeCase(filterName);

  database.exec(
    `
    UPDATE map_filters
      SET ${column} = $value
    `,
    {
      $value: value,
    },
  );
};
