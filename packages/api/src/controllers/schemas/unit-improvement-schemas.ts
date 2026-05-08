import { z } from 'zod';

export const getUnitImprovementsRowSchema = z
  .strictObject({
    unit_id: z.string(),
    level: z.number(),
  })
  .meta({ id: 'GetUnitImprovementsRow' });
