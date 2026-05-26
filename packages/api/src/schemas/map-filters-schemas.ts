import { z } from 'zod';

export const getMapFiltersRowSchema = z
  .strictObject({
    should_show_faction_reputation: z.number(),
    should_show_oasis_icons: z.number(),
    should_show_troop_movements: z.number(),
    should_show_wheat_fields: z.number(),
    should_show_tile_tooltips: z.number(),
    should_show_treasure_icons: z.number(),
  })
  .meta({ id: 'GetMapFiltersRow' });
