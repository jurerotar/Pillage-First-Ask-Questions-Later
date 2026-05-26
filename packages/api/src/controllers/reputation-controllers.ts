import { mapReputationRowToDto } from '../mappers/reputation-mapper';
import { selectPlayerFactionReputationsQuery } from '../queries/reputation-queries';
import { getReputationsRowSchema } from '../schemas/reputation-schemas';
import { createController } from '../utils/controller';

export const getReputations = createController(
  '/players/:playerId/reputations',
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectPlayerFactionReputationsQuery,
    bind: {
      $player_id: playerId,
    },
    schema: getReputationsRowSchema,
  });

  return rows.map(mapReputationRowToDto);
});
