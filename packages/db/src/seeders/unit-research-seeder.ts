import { newVillageUnitResearchFactory } from '@pillage-first/game-assets/factories/unit-research';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const unitResearchSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const [tier1UnitId, settlerUnitId] = newVillageUnitResearchFactory(
    server.playerConfiguration.tribe,
  );

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
        v.player_id = $player_id AND u.unit IN ($tier1Unit, $settlerUnit);
    `,
    bind: {
      $player_id: PLAYER_ID,
      $tier1Unit: tier1UnitId,
      $settlerUnit: settlerUnitId,
    },
  });
};
