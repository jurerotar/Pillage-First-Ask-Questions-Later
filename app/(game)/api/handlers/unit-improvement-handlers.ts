import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';

const getUnitImprovementsSchema = z
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

export const getUnitImprovements: ApiHandler<
  z.infer<typeof getUnitImprovementsSchema>[],
  'playerId'
> = async (_queryClient, database, { params }) => {
  const { playerId } = params;

  const unitImprovementModel = database.selectObjects(
    'SELECT unit_id, level FROM unit_improvements WHERE player_id = $player_id;',
    {
      $player_id: playerId,
    },
  );

  const listSchema = z.array(getUnitImprovementsSchema);

  return listSchema.parse(unitImprovementModel);
};
