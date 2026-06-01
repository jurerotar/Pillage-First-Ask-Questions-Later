import type { z } from 'zod';
import { mapFiltersDtoSchema } from '@pillage-first/types/dtos/map-filters';
import type { getMapFiltersRowSchema } from '../schemas/map-filters-schemas';

export const mapMapFiltersRowToDto = (
  row: z.infer<typeof getMapFiltersRowSchema>,
) =>
  mapFiltersDtoSchema.parse({
    shouldShowFactionReputation: Boolean(row.should_show_faction_reputation),
    shouldShowOasisIcons: Boolean(row.should_show_oasis_icons),
    shouldShowTileTooltips: Boolean(row.should_show_tile_tooltips),
    shouldShowTreasureIcons: Boolean(row.should_show_treasure_icons),
    shouldShowTroopMovements: Boolean(row.should_show_troop_movements),
    shouldShowWheatFields: Boolean(row.should_show_wheat_fields),
  });
