import { z } from 'zod';

export const farmListSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  villageId: z.number(),
  targetCount: z.number(),
});

export const updateFarmListSchema = z.strictObject({
  name: z.string().min(1).optional(),
  villageId: z.number().optional(),
});

export const farmListTileRowSchema = z
  .strictObject({
    tile_id: z.number(),
  })
  .meta({ id: 'FarmListTileRow' });

export const createFarmListSchema = z.strictObject({
  name: z.string().min(1),
});

export const addTileToFarmListSchema = z.strictObject({
  tileId: z.number(),
});
