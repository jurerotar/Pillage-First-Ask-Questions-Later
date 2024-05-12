import { database } from 'database/database';
import { OccupiableOasisTile, OccupiedOccupiableTile } from 'interfaces/models/game/tile';
import { Server } from 'interfaces/models/game/server';
import { Troop } from 'interfaces/models/game/troop';
import { Resource, ResourceCombination } from 'interfaces/models/game/resource';
import { NatureUnitId } from 'interfaces/models/game/unit';

export type GenerateTroopsWorkerPayload = {
  server: Server;
  occupiableOasisTiles: OccupiableOasisTile[];
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
};

export type GenerateTroopsWorkerReturn = {
  troops: Troop[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

const oasisTroopCombinations = new Map<Resource | ResourceCombination, NatureUnitId[]>([
  ['wood', ['WILD_BOAR', 'WOLF', 'BEAR']],
  ['wood-wheat', ['WILD_BOAR', 'WOLF', 'BEAR']],
  ['clay', ['RAT', 'SPIDER', 'WILD_BOAR']],
  ['clay-wheat', ['RAT', 'SPIDER', 'WILD_BOAR']],
  ['iron', ['RAT', 'SPIDER', 'BAT']],
  ['iron-wheat', ['RAT', 'SPIDER', 'BAT']],
  ['wheat', ['RAT', 'SERPENT', 'TIGER', 'CROCODILE']],
]);

self.addEventListener('message', async (event: MessageEvent<GenerateTroopsWorkerPayload>) => {
  const { server, occupiableOasisTiles, occupiedOccupiableTiles } = event.data;

  // occupiableOasisTiles.forEach(({ id, oasisResourceBonus }) => {
  //
  // });

  self.postMessage({ troops: [] });
  await database.troops.bulkAdd([]);
  self.close();
});
