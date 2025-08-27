import type { Seeder } from 'app/interfaces/db';
import type { DbTile } from 'app/interfaces/models/db/tile';
import type { VillageSize } from 'app/interfaces/models/game/village';
import { prngMulberry32 } from 'ts-seedrandom';
import { seededRandomIntFromInterval } from 'app/utils/common';
import { getVillageSize } from 'app/db/utils/village-size';

type OccupiableField = Pick<DbTile, 'id' | 'x' | 'y'>;

const villageSizeToMaxOasisAmountMap = new Map<VillageSize, number>([
  ['xxs', 0],
  ['xs', 0],
  ['sm', 0],
  ['md', 1],
  ['lg', 1],
  ['xl', 2],
  ['2xl', 2],
  ['3xl', 3],
  ['4xl', 3],
]);

export const occupiedOasisSeeder: Seeder = (database, server): void => {
  const prng = prngMulberry32(server.seed);

  const villageFields = database.selectObjects(
    'SELECT villages.id, x, y FROM tiles INNER JOIN villages ON tiles.id = villages.tile_id;',
  ) as OccupiableField[];
  const occupiableOasis = database.selectObjects(
    'SELECT oasis.id, x, y FROM tiles INNER JOIN oasis ON tiles.id = oasis.tile_id;',
  ) as OccupiableField[];

  const occupiableOasisMap = new Map<
    `${DbTile['x']}-${DbTile['y']}`,
    OccupiableField
  >(occupiableOasis.map((oasis) => [`${oasis.x}-${oasis.y}`, oasis]));

  const oasisByVillages: [number, number][] = [];

  for (const { id: villageId, x, y } of villageFields) {
    const villageSize = getVillageSize(server.configuration.mapSize, x, y);
    const maxOasisAmount = villageSizeToMaxOasisAmountMap.get(villageSize)!;

    let assignedOasisCounter = 0;

    outer: for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const key: `${DbTile['x']}-${DbTile['y']}` = `${x + dx}-${y + dy}`;

        const candidateTile = occupiableOasisMap.get(key);
        if (!candidateTile) {
          continue;
        }

        const willOasisBeAssigned =
          seededRandomIntFromInterval(prng, 1, 3) === 1;

        if (!willOasisBeAssigned) {
          continue;
        }

        oasisByVillages.push([villageId, candidateTile.id]);
        assignedOasisCounter += 1;

        // Delete key to make sure other villages can't overwrite it
        occupiableOasisMap.delete(key);

        if (assignedOasisCounter === maxOasisAmount) {
          break outer;
        }
      }
    }
  }

  const stmt = database.prepare(
    'UPDATE oasis SET village_id = $village_id WHERE id = $oasis_id;',
  );

  for (const resultSet of oasisByVillages) {
    const [villageId, oasisId] = resultSet;
    stmt.bind({ $village_id: villageId, $oasis_id: oasisId }).stepReset();
  }

  stmt.finalize();
};
