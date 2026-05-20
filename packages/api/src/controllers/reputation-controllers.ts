import { createController } from '../utils/controller';
import { mapReputationRowToDto } from './mappers/reputation-mapper';
import { getReputationsRowSchema } from './schemas/reputation-schemas';

export const getReputations = createController(
  '/players/:playerId/reputations',
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: `
    SELECT fi.faction, fr.reputation
    FROM faction_reputation fr
    JOIN faction_ids fi ON fr.target_faction_id = fi.id
    WHERE fr.source_faction_id = (SELECT faction_id FROM players WHERE id = $player_id);
    `,
    bind: {
      $player_id: playerId,
    },
    schema: getReputationsRowSchema,
  });

  return rows.map(mapReputationRowToDto);
});
