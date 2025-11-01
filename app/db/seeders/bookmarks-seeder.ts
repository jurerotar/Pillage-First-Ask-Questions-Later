import { buildings } from 'app/assets/buildings';
import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import { PLAYER_ID } from 'app/constants/player';

export const bookmarksSeeder: Seeder = (database): void => {
  const playerStartingVillageId = database.selectValue(
    `
    SELECT id
    FROM villages
    WHERE player_id = $player_id;
  `,
    { $player_id: PLAYER_ID },
  ) as number;

  const rows = buildings.map(({ id: buildingId }) => [
    playerStartingVillageId,
    buildingId,
    'default',
  ]);

  batchInsert(
    database,
    'bookmarks',
    ['village_id', 'building_id', 'tab_name'],
    rows,
  );
};
