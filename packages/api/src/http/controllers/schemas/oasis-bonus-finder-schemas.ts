import { z } from 'zod';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';

export const oasisBonusSchema = z.strictObject({
  bonus: z.union([z.literal(25), z.literal(50)]),
  resource: resourceSchema,
});

export const oasisBonusSlotSchema = z.array(oasisBonusSchema).max(2);

export const getTilesWithBonusesRowSchema = z
  .strictObject({
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    resource_field_composition: resourceFieldCompositionSchema,
    oasis_owners_json: z.string(),
    distance_squared: z.number(),
  })
  .meta({ id: 'GetTilesWithBonusesRow' });

export const ownedOasisRowSchema = z
  .strictObject({
    oasis_tile_id: z.number(),
    oasis_x: z.number(),
    oasis_y: z.number(),
    owner_village_id: z.number(),
    owner_village_name: z.string(),
    owner_village_slug: z.string().nullable(),
    owner_village_x: z.number(),
    owner_village_y: z.number(),
  })
  .meta({ id: 'OwnedOasisRow' });
