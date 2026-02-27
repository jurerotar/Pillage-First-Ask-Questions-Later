import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitsByTribe } from '@pillage-first/game-assets/utils/units';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const unitResearchSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const unitsByTribe = getUnitsByTribe(server.playerConfiguration.tribe);
  const tier1Unit = unitsByTribe.at(0)!;

  database.exec({
    sql: `
      INSERT INTO
        unit_research (village_id, unit_id)
      SELECT
        v.id,
        u.id
      FROM
        villages v,
        unit_ids u
      WHERE
        v.player_id = $player_id AND u.unit = $unit;
    `,
    bind: {
      $player_id: PLAYER_ID,
      $unit: tier1Unit.id,
    },
  });
};
