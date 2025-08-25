import type { Seeder } from 'app/interfaces/db';
import { getUnitsByTribe } from 'app/(game)/(village-slug)/utils/units';
import type { Village } from 'app/interfaces/models/game/village';

export const unitResearchSeeder: Seeder = (database, server): void => {
  const unitsByTribe = getUnitsByTribe(server.playerConfiguration.tribe);
  const tier1Unit = unitsByTribe.find(({ tier }) => tier === 'tier-1')!;

  const playerStartingVillageId = database.selectValue(
    `
      SELECT villages.id
      FROM villages
             JOIN tiles ON villages.tile_id = tiles.id
      WHERE tiles.x = 0
        AND tiles.y = 0;
    `,
  )! as Village['id'];

  database.exec({
    sql: 'INSERT INTO unit_research (village_id, unit_id) VALUES (?, ?);',
    bind: [playerStartingVillageId, tier1Unit.id],
  });
};
