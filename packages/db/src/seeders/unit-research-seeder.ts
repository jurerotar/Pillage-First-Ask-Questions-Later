import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitsByTribe } from '@pillage-first/game-assets/units/utils';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const unitResearchSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const unitsByTribe = getUnitsByTribe(server.playerConfiguration.tribe);
  const tier1Unit = unitsByTribe.find(({ tier }) => tier === 'tier-1')!;

  const playerStartingVillageId = database.selectValue({
    sql: `
      SELECT id
      FROM
        villages
      WHERE
        player_id = $player_id;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  });

  database.exec({
    sql: `
      INSERT INTO
        unit_research (village_id, unit_id)
      VALUES
        ($village_id, $unit_id);
    `,
    bind: {
      $village_id: playerStartingVillageId,
      $unit_id: tier1Unit.id,
    },
  });
};
