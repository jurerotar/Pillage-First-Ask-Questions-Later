import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  deleteHeroEffectsQuery,
  insertHeroEffectsQuery,
} from '../../../utils/queries/effect-queries.ts';
import { updateVillageResourcesAt } from '../../../utils/village.ts';

export const onHeroDeath = (database: DbFacade, timestamp: number) => {
  const villageId = database.selectValue({
    sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id;',
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;

  updateVillageResourcesAt(database, villageId, timestamp);

  database.exec({
    sql: deleteHeroEffectsQuery,
    bind: { $player_id: PLAYER_ID },
  });
};

export const onHeroRevive = (database: DbFacade, timestamp: number) => {
  const villageId = database.selectValue({
    sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id;',
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;

  updateVillageResourcesAt(database, villageId, timestamp);

  database.exec({
    sql: insertHeroEffectsQuery,
    bind: { $player_id: PLAYER_ID },
  });
};
