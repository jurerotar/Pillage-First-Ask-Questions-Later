import { z } from 'zod';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getResearchedUnitsSchema = z
  .strictObject({
    unit_id: unitIdSchema,
    village_id: z.number(),
  })
  .transform((t) => {
    return {
      unitId: t.unit_id,
      villageId: t.village_id,
    };
  });
