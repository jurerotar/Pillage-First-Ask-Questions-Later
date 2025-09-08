import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';

const getUnitImprovementsResponseSchema = z
  .strictObject({
    unit_id: z.string(),
    level: z.number(),
  })
  .transform((t) => {
    return {
      unitId: t.unit_id,
      level: t.level,
    };
  });

export const getUnitImprovements: ApiHandler<z.infer<typeof getUnitImprovementsResponseSchema>[]> = async (
  _queryClient,
  database,
) => {
  const unitImprovementModel = database.selectObjects('SELECT unit_id, level FROM unit_improvements;');

  const listSchema = z.array(getUnitImprovementsResponseSchema);

  return listSchema.parse(unitImprovementModel);
};
