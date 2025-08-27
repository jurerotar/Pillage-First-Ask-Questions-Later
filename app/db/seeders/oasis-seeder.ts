import type { Seeder } from 'app/interfaces/db';
import { prngMulberry32 } from 'ts-seedrandom';
import type { DbTile } from 'app/interfaces/models/db/tile';
import { seededRandomIntFromInterval } from 'app/utils/common';
import { decodeGraphicsProperty } from 'app/utils/map';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { Resource } from 'app/interfaces/models/game/resource';

type SelectReturn = {
  id: DbTile['id'];
  oasis_graphics: DbTile['oasis_graphics'];
};

export const oasisSeeder: Seeder = (database, server): void => {
  const prng = prngMulberry32(server.seed);

  const oasisTiles = database.selectObjects(
    'SELECT id, oasis_graphics FROM tiles WHERE type = $type;',
    { $type: 'oasis' },
  ) as SelectReturn[];

  const wildernessUpdateStatement = database.prepare(
    'UPDATE tiles SET type = $type WHERE id = $id',
  );

  const oasisBonuses: [number, Resource, number][] = [];

  for (const { id, oasis_graphics } of oasisTiles) {
    const shouldOasisHaveBonus = seededRandomIntFromInterval(prng, 1, 2) === 1;

    // If oasis does not have a bonus, mark it as wilderness
    if (!shouldOasisHaveBonus) {
      wildernessUpdateStatement
        .bind({ $type: 'wilderness', $id: id })
        .stepReset();
      continue;
    }

    const { oasisResource } = decodeGraphicsProperty(oasis_graphics!);

    const canBeCompositeBonus = oasisResource !== 'wheat';

    if (!canBeCompositeBonus) {
      const shouldHaveDoubleBonus =
        seededRandomIntFromInterval(prng, 1, 2) === 1;
      oasisBonuses.push([id, oasisResource, shouldHaveDoubleBonus ? 50 : 25]);
      continue;
    }

    const shouldHaveCompositeBonus =
      seededRandomIntFromInterval(prng, 1, 2) === 1;

    // Push both clay-25 and wheat-25 for example
    if (shouldHaveCompositeBonus) {
      oasisBonuses.push([id, oasisResource, 25]);
      oasisBonuses.push([id, 'wheat', 25]);
    }
  }

  wildernessUpdateStatement.finalize();

  batchInsert(
    database,
    'oasis',
    ['tile_id', 'resource', 'bonus', 'village_id'],
    oasisBonuses,
    // Village id can remain null because it's assigned in occupied-oasis-seeder
    (oasisBonus) => [...oasisBonus, null],
  );
};
