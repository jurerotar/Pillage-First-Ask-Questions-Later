import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { factionSchema } from '../models/faction';
import { resourceSchema } from '../models/resource';
import { resourceFieldCompositionSchema } from '../models/resource-field-composition';
import { tribeSchema } from '../models/tribe';
import { unitIdSchema } from '../models/unit';

export const mapOwnerDtoSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tribe: tribeSchema,
  faction: factionSchema,
});

export const mapOwnerVillageDtoSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  population: z.number(),
});

export const mapTileDtoSchema = z.discriminatedUnion('type', [
  z.strictObject({
    id: z.number(),
    coordinates: coordinatesSchema,
    type: z.literal('free'),
    owner: z.union([mapOwnerDtoSchema, z.null()]),
    ownerVillage: z.union([mapOwnerVillageDtoSchema, z.null()]),
    attributes: z.strictObject({
      resourceFieldComposition: resourceFieldCompositionSchema,
    }),
    item: z
      .strictObject({
        id: z.number(),
      })
      .nullable(),
  }),
  z.strictObject({
    id: z.number(),
    coordinates: coordinatesSchema,
    type: z.literal('oasis'),
    owner: z.union([mapOwnerDtoSchema, z.null()]),
    ownerVillage: z.union([mapOwnerVillageDtoSchema, z.null()]),
    attributes: z.strictObject({
      oasisGraphics: z.number(),
      isOccupiable: z.boolean(),
    }),
  }),
]);

export const mapTileTroopDtoSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.number(),
  tileId: z.number(),
  source: z.number(),
});

export const mapTileOasisBonusDtoSchema = z.strictObject({
  resource: resourceSchema,
  bonus: z.number(),
});

export const mapTileWorldItemDtoSchema = z.strictObject({
  id: z.number(),
  coordinates: coordinatesSchema,
  distance: z.number(),
  amount: z.number(),
});

export const mapMarkerDtoSchema = z.strictObject({
  tileId: z.number(),
});
