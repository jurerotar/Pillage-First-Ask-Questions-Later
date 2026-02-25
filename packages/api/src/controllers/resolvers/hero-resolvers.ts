import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { insertHeroEffectsQuery } from '../../utils/queries/effect-queries';
import { addTroops } from '../../utils/queries/troop-queries.ts';
import { updateVillageResourcesAt } from '../../utils/village.ts';

export const heroRevivalResolver: Resolver<GameEvent<'heroRevival'>> = (
  database,
  args,
) => {
  const { resolvesAt } = args;

  const villageIdToSpawnHeroIn = database.selectValue({
    sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id;',
    bind: {
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  })!;

  updateVillageResourcesAt(database, villageIdToSpawnHeroIn, resolvesAt);

  database.exec({
    sql: 'UPDATE heroes SET health = 100 WHERE player_id = $playerId;',
    bind: { $playerId: PLAYER_ID },
  });

  database.exec({
    sql: insertHeroEffectsQuery,
    bind: { $playerId: PLAYER_ID },
  });

  addTroops(database, [
    {
      unitId: 'HERO',
      amount: 1,
      tileId: villageIdToSpawnHeroIn,
      source: villageIdToSpawnHeroIn,
    },
  ]);
};
