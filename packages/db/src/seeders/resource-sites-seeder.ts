import { z } from 'zod';
import type { VillageSize } from '@pillage-first/types/models/village';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';

const VillageSelectResultRowSchema = z.strictObject({
  id: z.number(),
  x: z.number(),
  y: z.number(),
});

const OasisSelectResultRowSchema = z.strictObject({
  id: z.number(),
  bonus: z.number(),
  count_per_tile: z.number(),
});

const villageSizeToResourceAmountMap = new Map<VillageSize, number>([
  ['xxs', 6300],
  ['xs', 6300],
  ['sm', 31_300],
  ['md', 80_000],
  ['lg', 160_000],
  ['xl', 160_000],
  ['2xl', 160_000],
  ['3xl', 160_000],
  ['4xl', 160_000],
]);

export const resourceSitesSeeder: Seeder = (database, server): void => {
  const results: [number, number, number, number, number, number][] = [];

  const updatedAt = Date.now();

  const playerStartingTileId = database.selectValue({
    sql: 'SELECT id FROM tiles WHERE x = 0 AND y = 0;',
    schema: z.number(),
  })! as number;

  results.push([playerStartingTileId, 750, 750, 750, 750, updatedAt]);

  const villages = database.selectObjects({
    sql: 'SELECT tiles.id, x, y FROM tiles INNER JOIN villages ON tiles.id = villages.tile_id WHERE tiles.x != 0 AND tiles.y != 0;',
    schema: VillageSelectResultRowSchema,
  });

  const oasis = database.selectObjects({
    sql: `
    SELECT tiles.id,
           COUNT(oasis.tile_id) AS count_per_tile,
           MAX(oasis.bonus)     AS bonus
    FROM tiles
           INNER JOIN oasis ON tiles.id = oasis.tile_id
    GROUP BY tiles.id;
  `,
    schema: OasisSelectResultRowSchema,
  });

  for (const { id, x, y } of villages) {
    const villageSize = getVillageSize(server.configuration.mapSize, x, y);

    const resourceAmount = villageSizeToResourceAmountMap.get(villageSize)!;
    const [wood, clay, iron, wheat] = [
      resourceAmount,
      resourceAmount,
      resourceAmount,
      resourceAmount,
    ];
    results.push([id, wood, clay, iron, wheat, updatedAt]);
  }

  for (const { id, bonus, count_per_tile } of oasis) {
    // If oasis has a 50% bonus or there's multiple bonuses, it has a higher resource limit
    const resourceAmount = bonus === 50 || count_per_tile === 2 ? 2000 : 1000;
    const [wood, clay, iron, wheat] = [
      resourceAmount,
      resourceAmount,
      resourceAmount,
      resourceAmount,
    ];
    results.push([id, wood, clay, iron, wheat, updatedAt]);
  }

  batchInsert(
    database,
    'resource_sites',
    ['tile_id', 'wood', 'clay', 'iron', 'wheat', 'updated_at'],
    results,
  );
};
