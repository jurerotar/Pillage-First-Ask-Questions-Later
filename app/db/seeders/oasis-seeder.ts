import type { Seeder } from 'app/interfaces/db';
import { prngMulberry32 } from 'ts-seedrandom';
import type { TileModel } from 'app/interfaces/models/game/tile';
import { seededRandomIntFromInterval } from 'app/utils/common';
import { decodeGraphicsProperty } from 'app/utils/map';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { Resource } from 'app/interfaces/models/game/resource';

type SelectReturn = {
  id: TileModel['id'];
  oasis_graphics: TileModel['oasis_graphics'];
};

export const oasisSeeder: Seeder = (database, server): void => {
  const prng = prngMulberry32(server.seed);

  const oasisTiles = database.selectObjects(
    'SELECT id, oasis_graphics FROM tiles WHERE type = $type;',
    { $type: 'oasis' },
  ) as SelectReturn[];

  const oasisBonuses: [number, Resource, number, null][] = [];

  for (const { id, oasis_graphics } of oasisTiles) {
    const shouldOasisHaveBonus = seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (!shouldOasisHaveBonus) {
      continue;
    }

    const { oasisResource } = decodeGraphicsProperty(oasis_graphics!);

    const canBeCompositeBonus = oasisResource !== 'wheat';

    if (!canBeCompositeBonus) {
      const shouldHaveDoubleBonus =
        seededRandomIntFromInterval(prng, 1, 2) === 1;
      oasisBonuses.push([
        id,
        oasisResource,
        shouldHaveDoubleBonus ? 50 : 25,
        null,
      ]);
      continue;
    }

    const shouldHaveCompositeBonus =
      seededRandomIntFromInterval(prng, 1, 2) === 1;

    // Push both clay-25 and wheat-25 for example
    if (shouldHaveCompositeBonus) {
      oasisBonuses.push([id, oasisResource, 25, null]);
      oasisBonuses.push([id, 'wheat', 25, null]);
    }
  }

  batchInsert(
    database,
    'oasis',
    ['tile_id', 'resource', 'bonus', 'village_id'],
    oasisBonuses,
  );
};
