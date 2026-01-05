import { z } from 'zod';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import { playerSchema } from '@pillage-first/types/models/player';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';

const tileVillageSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  // TODO: NPC villages don't have a village slug. Should this be changed?
  slug: z.string().nullable(),
  population: z.number(),
});

export const tileTypeSchema = z.enum(['free', 'oasis']);

export const baseTileSchema = z.strictObject({
  id: z.number(),
  coordinates: coordinatesSchema,
  type: tileTypeSchema,
  owner: playerSchema.nullable(),
  ownerVillage: tileVillageSchema.nullable(),
});

const baseOccupiableTileSchema = baseTileSchema.extend({
  type: z.literal('free'),
  attributes: z.strictObject({
    resourceFieldComposition: resourceFieldCompositionSchema,
  }),
  item: z
    .strictObject({
      id: z.number(),
    })
    .nullable(),
});

const occupiedOccupiableTileSchema = baseOccupiableTileSchema.extend({
  owner: playerSchema,
  ownerVillage: tileVillageSchema,
});

const unoccupiedOccupiableTileSchema = baseOccupiableTileSchema.extend({
  owner: z.literal(null),
  ownerVillage: z.literal(null),
});

const baseOasisTileSchema = baseTileSchema.extend({
  type: z.literal('oasis'),
  attributes: z.strictObject({
    oasisGraphics: z.number(),
    // This may be null, because only occupiable oasis are stored in the database. Oasis resource is calculated from oasisGraphics
    oasisResource: resourceSchema.nullable(),
  }),
});

const occupiedOasisTileSchema = baseOasisTileSchema.extend({
  owner: playerSchema,
  ownerVillage: tileVillageSchema,
});

const unoccupiedOasisTileSchema = baseOasisTileSchema.extend({
  owner: z.literal(null),
  ownerVillage: z.literal(null),
});

export const tileSchema = z.discriminatedUnion('type', [
  baseOccupiableTileSchema,
  baseOasisTileSchema,
]);

export const occupiableTileSchema = z.union([
  occupiedOccupiableTileSchema,
  unoccupiedOccupiableTileSchema,
]);
export const oasisTileSchema = z.union([
  occupiedOasisTileSchema,
  unoccupiedOasisTileSchema,
]);

export type OccupiedOccupiableTile = z.infer<
  typeof occupiedOccupiableTileSchema
>;
export type OccupiableTile = z.infer<typeof occupiableTileSchema>;

export type OccupiedOasisTile = z.infer<typeof occupiedOasisTileSchema>;
export type OasisTile = z.infer<typeof oasisTileSchema>;

export type Tile = z.infer<typeof tileSchema>;
