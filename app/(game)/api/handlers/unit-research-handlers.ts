import { z } from 'zod';
import type { ApiHandler } from 'app/interfaces/api';
import { unitIdSchema } from 'app/interfaces/models/game/unit';

const getResearchedUnitsSchema = z
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

export const getResearchedUnits: ApiHandler<'villageId'> = (
  database,
  { params },
) => {
  const { villageId } = params;

  const unitResearchModels = database.selectObjects(
    `
    SELECT unit_id, village_id
    FROM unit_research
    WHERE village_id = $village_id;
  `,
    { $village_id: villageId },
  );

  return z.array(getResearchedUnitsSchema).parse(unitResearchModels);
};
