import { z } from 'zod';

export const getResearchedUnitsRowSchema = z
  .strictObject({
    unit_id: z.string(),
    village_id: z.number(),
  })
  .meta({ id: 'GetResearchedUnitsRow' });
