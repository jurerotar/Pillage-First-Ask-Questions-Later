import { z } from 'zod';

export const getUnitImprovementsSchema = z
  .strictObject({
    unit_id: z.string(),
    level: z.number(),
  })
  .transform((t) => {
    return {
      unitId: t.unit_id,
      level: t.level,
    };
  })
  .pipe(
    z.strictObject({
      unitId: z.string(),
      level: z.number(),
    }),
  )
  .meta({ id: 'GetUnitImprovements' });
