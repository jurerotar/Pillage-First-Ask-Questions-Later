import { createController } from '../http/controller';
import { selectPlayerFactionReputationsQuery } from '../queries/reputation-queries';
import { mapReputationRowToDto } from './mappers/reputation-mapper';
import { getReputationsRowSchema } from './schemas/reputation-schemas';

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
