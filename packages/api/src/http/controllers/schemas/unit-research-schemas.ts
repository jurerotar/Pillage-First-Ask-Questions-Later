import { z } from 'zod';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getResearchedUnitsRowSchema = z
  .strictObject({
    unit_id: unitIdSchema,
    village_id: z.number(),
  })
  .meta({ id: 'GetResearchedUnitsRow' });
