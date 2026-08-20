import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { resourceFieldCompositionSchema } from '../models/resource-field-composition';
import { tileTypeSchema } from '../models/tile';
import { unitIdSchema } from '../models/unit';

export const playerVillageDtoSchema = z.strictObject({
  id: z.number(),
  tileId: z.number(),
  coordinates: coordinatesSchema,
  name: z.string(),
  slug: z.string(),
  resourceFieldComposition: resourceFieldCompositionSchema,
});

export const playerVillageWithPopulationDtoSchema =
  playerVillageDtoSchema.extend({
    population: z.number(),
  });

export const villageTroopDtoSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.number(),
  tileId: z.number(),
  sourceTileId: z.number(),
  sourceTileType: tileTypeSchema.nullable(),
});

export const woundedTroopDtoSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.number(),
  updatedAt: z.number(),
});

export const sentReinforcementDtoSchema = z.strictObject({
  targetType: z.enum(['village', 'oasis']),
  village: playerVillageDtoSchema,
  troops: z.array(villageTroopDtoSchema),
});
