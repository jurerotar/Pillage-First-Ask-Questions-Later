import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getReputationLevel } from '@pillage-first/utils/reputation';
import { getReputations } from '../reputation-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('reputation-controllers', () => {
  test('getReputations should return reputations for a player', async () => {
    const database = await prepareTestDatabase();

    const reputations = getReputations(
      database,
      createControllerArgs<'/players/:playerId/reputations'>({
        path: { playerId: PLAYER_ID },
      }),
    );

    const storedReputations = database.selectObjects({
      sql: `
        SELECT fi.faction, fr.reputation
        FROM faction_reputation fr
        JOIN faction_ids fi ON fi.id = fr.target_faction_id
        WHERE fr.source_faction_id = (
          SELECT faction_id FROM players WHERE id = $player_id
        );
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        faction: z.string(),
        reputation: z.number(),
      }),
    });

    expect(reputations).toStrictEqual(
      storedReputations.map(({ faction, reputation }) => ({
        faction,
        reputation,
        reputationLevel: getReputationLevel(reputation),
      })),
    );
  });
});
