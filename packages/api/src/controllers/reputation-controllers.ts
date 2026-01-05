import { z } from 'zod';
import { factionSchema } from '@pillage-first/types/models/faction';
import { getReputationLevel } from '@pillage-first/utils/reputation';
import type { Controller } from '../types/controller';

const getReputationsSchema = z
  .strictObject({
    faction: factionSchema,
    reputation: z.number(),
  })
  .transform((t) => ({
    faction: t.faction,
    reputation: t.reputation,
    reputationLevel: getReputationLevel(t.reputation),
  }));

/**
 * GET /me/reputations
 * @pathParam {number} playerId
 */
export const getReputations: Controller<'/me/reputations'> = (
  database,
  { params },
) => {
  const { playerId } = params;

  const rows = database.selectObjects(
    `
    SELECT f.faction, fr.reputation
    FROM faction_reputation fr
    JOIN factions f ON fr.target_faction_id = f.id
    WHERE fr.source_faction_id = (SELECT faction_id FROM players WHERE id = $player_id);
    `,
    {
      $player_id: playerId,
    },
  );

  return z.array(getReputationsSchema).parse(rows);
};
