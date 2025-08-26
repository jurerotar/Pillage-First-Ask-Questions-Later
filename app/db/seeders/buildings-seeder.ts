import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import { buildings } from 'app/(game)/(village-slug)/assets/buildings';

export const buildingsSeeder: Seeder = (database): void => {
  const buildingIds = buildings.map(({ id }) => [id]);

  batchInsert(database, 'buildings', ['name'], buildingIds, (row) => row);
};
