import { z } from 'zod';
import { factionSchema } from '@pillage-first/types/models/faction';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { tileTypeSchema } from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';

export const getTilesSchema = z
  .strictObject({
    id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    type: tileTypeSchema,

    rfc: resourceFieldCompositionSchema.nullable(),
    oasis_graphics: z.number().nullable(),
    oasis_is_occupiable: z.number().nullable(),

    player_id: z.number().nullable(),
    player_slug: z.string().nullable(),
    player_name: z.string().nullable(),
    player_tribe: tribeSchema.nullable(),
    player_faction: factionSchema.nullable(),

    village_id: z.number().nullable(),
    village_name: z.string().nullable(),
    village_slug: z.string().nullable(),
    population: z.number().nullable(),

    item_id: z.number().nullable(),
  })
  .meta({ id: 'GetTilesRow' });

export const getTileTroopsSchema = z
  .strictObject({
    unit_id: z.string(),
    amount: z.number(),
    tile_id: z.number(),
    source_tile_id: z.number(),
  })
  .meta({ id: 'GetTileTroopsRow' });

export const getTileOasisBonusesSchema = z
  .strictObject({
    resource: resourceSchema,
    bonus: z.number(),
  })
  .meta({ id: 'GetTileOasisBonusesRow' });

export const getTileWorldItemSchema = z
  .strictObject({
    item_id: z.number(),
    amount: z.number(),
  })
  .meta({ id: 'GetTileWorldItemRow' });

export const getMapMarkersSchema = z
  .strictObject({
    tile_id: z.number(),
  })
  .meta({ id: 'GetMapMarkersRow' });
