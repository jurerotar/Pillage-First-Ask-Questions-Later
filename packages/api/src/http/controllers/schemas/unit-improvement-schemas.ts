import { z } from 'zod';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getUnitImprovementsRowSchema = z
  .strictObject({
    unit_id: unitIdSchema,
    level: z.number(),
  })
  .meta({ id: 'GetUnitImprovementsRow' });
