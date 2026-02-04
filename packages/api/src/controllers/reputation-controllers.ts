import { createController } from '../types/controller';
import { getReputationsSchema } from './schemas/reputation-schemas';

export const getReputations = createController(
  '/players/:playerId/reputations',
)(({ database, path: { playerId } }) => {
  return database.selectObjects({
    sql: `
    SELECT f.faction, fr.reputation
    FROM faction_reputation fr
    JOIN factions f ON fr.target_faction_id = f.id
    WHERE fr.source_faction_id = (SELECT faction_id FROM players WHERE id = $player_id);
    `,
    bind: {
      $player_id: playerId,
    },
    schema: getReputationsSchema,
  });
});
