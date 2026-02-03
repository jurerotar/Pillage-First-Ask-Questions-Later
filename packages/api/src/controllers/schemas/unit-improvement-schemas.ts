import { z } from 'zod';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getUnitImprovementsSchema = z
  .strictObject({
    unit_id: unitIdSchema,
    level: z.number(),
  })
  .transform((t) => {
    return {
      unitId: t.unit_id,
      level: t.level,
    };
  });
