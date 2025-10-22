import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';
import { unitIdSchema } from 'app/interfaces/models/game/unit';

const getUnitImprovementsSchema = z
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

export const getUnitImprovements: ApiHandler<'playerId'> = (
  database,
  { params },
) => {
  const { playerId } = params;

  const unitImprovementModel = database.selectObjects(
    'SELECT unit_id, level FROM unit_improvements WHERE player_id = $player_id;',
    {
      $player_id: playerId,
    },
  );

  return z.array(getUnitImprovementsSchema).parse(unitImprovementModel);
};
