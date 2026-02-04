import { createController } from '../utils/controller';
import { getUnitImprovementsSchema } from './schemas/unit-improvement-schemas';

export const getUnitImprovements = createController(
  '/players/:playerId/unit-improvements',
)(({ database, path: { playerId } }) => {
  return database.selectObjects({
    sql: 'SELECT unit_id, level FROM unit_improvements WHERE player_id = $player_id;',
    bind: {
      $player_id: playerId,
    },
    schema: getUnitImprovementsSchema,
  });
});
