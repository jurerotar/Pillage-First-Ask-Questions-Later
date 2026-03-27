import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { deleteHeroEffectsQuery } from '../../../utils/queries/effect-queries';
import { updateVillageResourcesAt } from '../../../utils/village';

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

  database.exec({
    sql: "DELETE FROM events WHERE type = 'heroHealthRegeneration';",
  });
};
