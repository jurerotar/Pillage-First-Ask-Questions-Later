import { buildings } from 'app/assets/buildings';
import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import { PLAYER_ID } from 'app/constants/player';
import type { Village } from 'app/interfaces/models/game/village';

export const bookmarksSeeder: Seeder = (database): void => {
  const playerStartingVillageId = database.selectValue(
    `
    SELECT id
    FROM villages
    WHERE player_id = $player_id;
  `,
    { $player_id: PLAYER_ID },
  ) as Village['id'];

  const rows = buildings.map(({ id: buildingId }) => [
    PLAYER_ID,
    playerStartingVillageId,
    buildingId,
    'default',
  ]);

  batchInsert(
    database,
    'bookmarks',
    ['player_id', 'village_id', 'building_id', 'tab_name'],
    rows,
  );
};
