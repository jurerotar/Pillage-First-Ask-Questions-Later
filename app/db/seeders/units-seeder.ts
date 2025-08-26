import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import { units } from 'app/(game)/(village-slug)/assets/units';

export const unitsSeeder: Seeder = (database): void => {
  const unitIds = units.map(({ id }) => [id]);

  batchInsert(database, 'units', ['name'], unitIds, (row) => row);
};
