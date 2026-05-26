import { mapUnitImprovementRowToDto } from '../mappers/unit-mapper';
import { selectPlayerUnitImprovementsQuery } from '../queries/unit-queries';
import { getUnitImprovementsRowSchema } from '../schemas/unit-improvement-schemas';
import { createController } from '../utils/controller';

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
