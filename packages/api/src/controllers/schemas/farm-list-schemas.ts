import { z } from 'zod';

export const farmListSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
});

export const farmListTileSchema = z
  .strictObject({
    tile_id: z.number(),
  })
  .transform((t) => t.tile_id);

export const createFarmListSchema = z.strictObject({
  name: z.string().min(1),
});

export const addTileToFarmListSchema = z.strictObject({
  tileId: z.number(),
});
