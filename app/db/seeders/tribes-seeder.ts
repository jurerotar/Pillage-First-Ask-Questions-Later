import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';

export const tribesSeeder: Seeder = (database): void => {
  const tribes: PlayableTribe[][] = [
    ['egyptians'],
    ['gauls'],
    ['huns'],
    ['romans'],
    ['teutons'],
  ];

  batchInsert(database, 'tribes', ['name'], tribes, (row) => row);
};
