import { z } from 'zod';

export const mapFiltersDtoSchema = z.strictObject({
  shouldShowFactionReputation: z.boolean(),
  shouldShowOasisIcons: z.boolean(),
  shouldShowTileTooltips: z.boolean(),
  shouldShowTreasureIcons: z.boolean(),
  shouldShowTroopMovements: z.boolean(),
  shouldShowWheatFields: z.boolean(),
});
