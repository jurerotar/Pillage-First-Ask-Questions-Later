import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';

const getResearchedUnitsSchema = z
  .strictObject({
    unit_id: z.string(),
    village_id: z.number(),
  })
  .transform((t) => {
    return {
      unitId: t.unit_id,
      villageId: t.village_id,
    };
  });

export const getResearchedUnits: ApiHandler<
  z.infer<typeof getResearchedUnitsSchema>[],
  'villageId'
> = async (_queryClient, database, { params }) => {
  const { villageId } = params;

  const unitResearchModels = database.selectObjects(
    `
    SELECT unit_id, village_id
    FROM unit_research
    WHERE village_id = $village_id;
  `,
    { $village_id: villageId },
  );

  const listSchema = z.array(getResearchedUnitsSchema);

  return listSchema.parse(unitResearchModels);
};
