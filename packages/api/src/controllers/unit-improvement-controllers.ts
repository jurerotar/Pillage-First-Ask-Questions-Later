import { createController } from '../utils/controller';
import { mapUnitImprovementRowToDto } from './mappers/unit-mapper';
import { getUnitImprovementsRowSchema } from './schemas/unit-improvement-schemas';

export const getUnitImprovements = createController(
  '/players/:playerId/unit-improvements',
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: `
      SELECT ui.unit AS unit_id, u.level
      FROM
        unit_improvements u
          JOIN unit_ids ui ON ui.id = u.unit_id
      WHERE
        u.player_id = $player_id;
    `,
    bind: {
      $player_id: playerId,
    },
    schema: getUnitImprovementsRowSchema,
  });

  return rows.map(mapUnitImprovementRowToDto);
});
