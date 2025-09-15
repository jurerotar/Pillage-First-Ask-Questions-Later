import type { Seeder } from 'app/interfaces/db';
import { getUnitsByTribe } from 'app/(game)/(village-slug)/utils/units';
import type { Village } from 'app/interfaces/models/game/village';
import { PLAYER_ID } from 'app/constants/player';

export const unitResearchSeeder: Seeder = (database, server): void => {
  const unitsByTribe = getUnitsByTribe(server.playerConfiguration.tribe);
  const tier1Unit = unitsByTribe.find(({ tier }) => tier === 'tier-1')!;

  const playerStartingVillageId = database.selectValue(
    `
    SELECT id
    FROM villages
    WHERE player_id = $player_id;
  `,
    { $player_id: PLAYER_ID },
  ) as Village['id'];

  database.exec({
    sql: `
    INSERT INTO unit_research (village_id, unit_id)
    VALUES ($village_id, $unit_id);
  `,
    bind: {
      $village_id: playerStartingVillageId,
      $unit_id: tier1Unit.id,
    },
  });
};
