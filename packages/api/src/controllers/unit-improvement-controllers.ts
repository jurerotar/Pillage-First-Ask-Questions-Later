import { createController } from '../http/controller';
import { selectPlayerUnitImprovementsQuery } from '../queries/unit-queries';
import { mapUnitImprovementRowToDto } from './mappers/unit-mapper';
import { getUnitImprovementsRowSchema } from './schemas/unit-improvement-schemas';

export const getUnitImprovements = createController(
  '/players/:playerId/unit-improvements',
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectPlayerUnitImprovementsQuery,
    bind: {
      $player_id: playerId,
    },
    schema: getUnitImprovementsRowSchema,
  });

  return rows.map(mapUnitImprovementRowToDto);
});
