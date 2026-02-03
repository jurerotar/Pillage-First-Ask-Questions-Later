import { z } from 'zod';

export const getMapFiltersSchema = z
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
