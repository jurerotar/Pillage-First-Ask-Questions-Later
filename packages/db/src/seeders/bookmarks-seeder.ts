import { z } from 'zod';
import { buildings } from '@pillage-first/game-assets/buildings';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const bookmarksSeeder = (database: DbFacade): void => {
  const playerStartingVillageId = database.selectValue({
    sql: `
    SELECT id
    FROM villages
    WHERE player_id = $player_id;
  `,
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;

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
