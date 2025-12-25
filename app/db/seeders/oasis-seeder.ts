import { prngMulberry32 } from 'ts-seedrandom';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { Seeder } from 'app/interfaces/db';
import type { Resource } from 'app/interfaces/models/game/resource';
import { seededRandomIntFromInterval } from 'app/utils/common';
import { decodeGraphicsProperty } from 'app/utils/map';

export const oasisSeeder: Seeder = (database, server): void => {
  const prng = prngMulberry32(server.seed);

  const oasisTiles = database.selectObjects(
    'SELECT id, oasis_graphics FROM tiles WHERE type = $type;',
    { $type: 'oasis' },
  ) as {
    id: number;
    oasis_graphics: number;
  }[];

  const oasisBonuses: [number, Resource, number, null][] = [];

  for (const { id, oasis_graphics } of oasisTiles) {
    const shouldOasisHaveBonus = seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (!shouldOasisHaveBonus) {
      continue;
    }

    const { oasisResource } = decodeGraphicsProperty(oasis_graphics);

    const shouldHaveDoubleBonus = seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (shouldHaveDoubleBonus) {
      oasisBonuses.push([id, oasisResource, 50, null]);

      continue;
    }

    // If oasis does not have 50% bonus, push 25% bonus instead.
    oasisBonuses.push([id, oasisResource, 25, null]);

    // If oasis is wheat, it can't have any other resource bonus
    if (oasisResource === 'wheat') {
      continue;
    }

    const shouldHaveCompositeBonus =
      seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (!shouldHaveCompositeBonus) {
      continue;
    }

    oasisBonuses.push([id, 'wheat', 25, null]);
  }

  batchInsert(
    database,
    'oasis',
    ['tile_id', 'resource', 'bonus', 'village_id'],
    oasisBonuses,
  );
};
