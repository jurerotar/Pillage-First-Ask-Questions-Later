import { prngMulberry32 } from 'ts-seedrandom';
import type { Resource } from '@pillage-first/types/models/resource';
import type { Server } from '@pillage-first/types/models/server';
import { decodeGraphicsProperty } from '@pillage-first/utils/map';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';

type OasisBonusSourceTile = {
  id: number;
  oasis_graphics: number;
};

export type GeneratedOasisBonus = {
  tileId: number;
  resource: Resource;
  bonus: 25 | 50;
};

export const generateOasisBonusesForTiles = (
  server: Server,
  oasisTiles: OasisBonusSourceTile[],
): GeneratedOasisBonus[] => {
  const prng = prngMulberry32(server.seed);
  const oasisBonuses: GeneratedOasisBonus[] = [];

  for (const { id, oasis_graphics } of oasisTiles) {
    const { oasisResource } = decodeGraphicsProperty(oasis_graphics);

    const shouldHaveDoubleBonus = seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (shouldHaveDoubleBonus) {
      oasisBonuses.push({
        tileId: id,
        resource: oasisResource,
        bonus: 50,
      });

      continue;
    }

    oasisBonuses.push({
      tileId: id,
      resource: oasisResource,
      bonus: 25,
    });

    if (oasisResource === 'wheat') {
      continue;
    }

    const shouldHaveCompositeBonus =
      seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (!shouldHaveCompositeBonus) {
      continue;
    }

    oasisBonuses.push({
      tileId: id,
      resource: 'wheat',
      bonus: 25,
    });
  }

  return oasisBonuses;
};
