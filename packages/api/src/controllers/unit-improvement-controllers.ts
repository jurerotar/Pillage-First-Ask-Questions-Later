import { createController } from '../utils/controller';
import { getUnitImprovementsSchema } from './schemas/unit-improvement-schemas';

export const getUnitImprovements = createController(
  '/players/:playerId/unit-improvements',
)(({ database, path: { playerId } }) => {
  return database.selectObjects({
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
    schema: getUnitImprovementsSchema,
  });
});
