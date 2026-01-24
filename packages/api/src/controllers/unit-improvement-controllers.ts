import { z } from 'zod';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import type { Controller } from '../types/controller';

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

/**
 * GET /players/:playerId/unit-improvements
 * @pathParam {number} playerId
 */
export const getUnitImprovements: Controller<
  '/players/:playerId/unit-improvements'
> = (database, { params }) => {
  const { playerId } = params;

  const unitImprovementModel = database.selectObjects({
    sql: 'SELECT unit_id, level FROM unit_improvements WHERE player_id = $player_id;',
    bind: {
      $player_id: playerId,
    },
  });

  return z.array(getUnitImprovementsSchema).parse(unitImprovementModel);
};
