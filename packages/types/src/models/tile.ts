import { z } from 'zod';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import { playerSchema } from '@pillage-first/types/models/player';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';

const tileVillageSchema = z
  .strictObject({
    id: z.number(),
    name: z.string(),
    // TODO: NPC villages don't have a village slug. Should this be changed?
    slug: z.string().nullable(),
    population: z.number(),
  })
  .meta({ id: 'TileVillage' });

export const tileTypeSchema = z
  .enum(['free', 'oasis'])
  .meta({ id: 'TileType' });

export const baseTileSchema = z
  .strictObject({
    id: z.number(),
    coordinates: coordinatesSchema,
    type: tileTypeSchema,
    owner: playerSchema.nullable(),
    ownerVillage: tileVillageSchema.nullable(),
  })
  .meta({ id: 'BaseTile' });

const baseOccupiableTileSchema = baseTileSchema
  .extend({
    type: z.literal('free'),
    attributes: z.strictObject({
      resourceFieldComposition: resourceFieldCompositionSchema,
    }),
    item: z
      .strictObject({
        id: z.number(),
      })
      .nullable(),
  })
  .meta({ id: 'BaseOccupiableTile' });

const occupiedOccupiableTileSchema = baseOccupiableTileSchema
  .extend({
    owner: playerSchema,
    ownerVillage: tileVillageSchema,
  })
  .meta({ id: 'OccupiedOccupiableTile' });

const unoccupiedOccupiableTileSchema = baseOccupiableTileSchema
  .extend({
    owner: z.literal(null),
    ownerVillage: z.literal(null),
  })
  .meta({ id: 'UnoccupiedOccupiableTile' });

const baseOasisTileSchema = baseTileSchema
  .extend({
    type: z.literal('oasis'),
    attributes: z.strictObject({
      oasisGraphics: z.number(),
      isOccupiable: z.boolean(),
    }),
  })
  .meta({ id: 'BaseOasisTile' });

const occupiedOasisTileSchema = baseOasisTileSchema
  .extend({
    owner: playerSchema,
    ownerVillage: tileVillageSchema,
  })
  .meta({ id: 'OccupiedOasisTile' });

const unoccupiedOasisTileSchema = baseOasisTileSchema
  .extend({
    owner: z.literal(null),
    ownerVillage: z.literal(null),
  })
  .meta({ id: 'UnoccupiedOasisTile' });

export const tileSchema = z
  .discriminatedUnion('type', [baseOccupiableTileSchema, baseOasisTileSchema])
  .meta({ id: 'Tile' });

export const occupiableTileSchema = z
  .union([occupiedOccupiableTileSchema, unoccupiedOccupiableTileSchema])
  .meta({ id: 'OccupiableTile' });
export const oasisTileSchema = z
  .union([occupiedOasisTileSchema, unoccupiedOasisTileSchema])
  .meta({ id: 'OasisTile' });

export type OccupiedOccupiableTile = z.infer<
  typeof occupiedOccupiableTileSchema
>;
export type OccupiableTile = z.infer<typeof occupiableTileSchema>;

export type OccupiedOasisTile = z.infer<typeof occupiedOasisTileSchema>;
export type UnoccupiedOasisTile = z.infer<typeof unoccupiedOasisTileSchema>;
export type OasisTile = z.infer<typeof oasisTileSchema>;

export type Tile = z.infer<typeof tileSchema>;
