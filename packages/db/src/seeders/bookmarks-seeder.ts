import { buildings } from '@pillage-first/game-assets/buildings';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';
import { z } from 'zod';

export const bookmarksSeeder: Seeder = (database): void => {
  const playerStartingVillageId = database.selectValue({
    sql: `
    SELECT id
    FROM villages
    WHERE player_id = $player_id;
  `,
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  }) as number;

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
