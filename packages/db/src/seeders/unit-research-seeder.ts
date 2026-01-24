import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitsByTribe } from '@pillage-first/game-assets/units/utils';
import type { Village } from '@pillage-first/types/models/village';
import type { Seeder } from '../types/seeder';

export const unitResearchSeeder: Seeder = (database, server): void => {
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
  }) as Village['id'];

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
