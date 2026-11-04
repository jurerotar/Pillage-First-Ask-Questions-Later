import { z } from 'zod';
import { reputationSchema } from '@pillage-first/types/models/reputation';
import { selectPlayerFactionReputationsQuery } from '../../queries/reputation-queries';
import { createController } from '../controller';
import { mapReputationRowToDto } from './mappers/reputation-mapper';
import { getReputationsRowSchema } from './schemas/reputation-schemas';

export const getReputations = createController('/me/reputations', {
  summary: 'Get player faction reputations',
  response: z.array(reputationSchema),
})(({ database, context: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectPlayerFactionReputationsQuery,
    bind: {
      $player_id: playerId,
    },
    schema: getReputationsRowSchema,
  });

  return rows.map(mapReputationRowToDto);
});
