import { z } from 'zod';

export const getResearchedUnitsSchema = z
  .strictObject({
    unit_id: z.string(),
    village_id: z.number(),
  })
  .transform((t) => {
    return {
      unitId: t.unit_id,
      villageId: t.village_id,
    };
  })
  .pipe(
    z.strictObject({
      unitId: z.string(),
      villageId: z.number(),
    }),
  )
  .meta({ id: 'GetResearchedUnits' });
