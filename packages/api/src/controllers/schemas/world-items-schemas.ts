import { z } from 'zod';

export const getArtifactsAroundVillageRowSchema = z
  .strictObject({
    item_id: z.number(),
    x: z.number(),
    y: z.number(),
    vx: z.number(),
    vy: z.number(),
  })
  .meta({ id: 'GetArtifactsAroundVillageRow' });
