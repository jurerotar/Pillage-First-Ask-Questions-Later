import { buildings } from 'app/assets/buildings';
import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';

export const bookmarksSeeder: Seeder = (database): void => {
  const rows = buildings.map(({ id }) => [id, 'default']);

  batchInsert(database, 'bookmarks', ['building_id', 'tab_name'], rows);
};
