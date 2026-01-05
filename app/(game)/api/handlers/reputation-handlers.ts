import { z } from 'zod';
import { getReputationLevel } from 'app/(game)/(village-slug)/utils/reputation';
import type { ApiHandler } from 'app/interfaces/api';
import { factionSchema } from 'app/interfaces/models/game/faction';

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

export const getReputations: ApiHandler<'playerId'> = (
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
