import type { Controller } from '../types/controller';
import { getUnitImprovementsSchema } from './schemas/unit-improvement-schemas.ts';

/**
 * GET /players/:playerId/unit-improvements
 */
export const getUnitImprovements: Controller<
  '/players/:playerId/unit-improvements'
> = (database, { params }) => {
  const { playerId } = params;

  return database.selectObjects({
    sql: 'SELECT unit_id, level FROM unit_improvements WHERE player_id = $player_id;',
    bind: {
      $player_id: playerId,
    },
    schema: getUnitImprovementsSchema,
  });
};
