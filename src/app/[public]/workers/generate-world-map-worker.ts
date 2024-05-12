import { Server } from 'interfaces/models/game/server';
import { mapFactory } from 'app/factories/map-factory';
import { OccupiableOasisTile, OccupiedOccupiableTile } from 'interfaces/models/game/tile';
import { Player } from 'interfaces/models/game/player';
import { database } from 'database/database';
import { chunk } from 'lodash-es';
import { isOccupiedOccupiableTile, isUnoccupiedOasisTile } from 'app/[game]/utils/guards/map-guards';

export type GenerateWorldMapWorkerPayload = {
  server: Server;
  players: Player[];
};

export type GenerateWorldMapWorkerReturn = {
  occupiableOasisTiles: OccupiableOasisTile[];
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', async (event: MessageEvent<GenerateWorldMapWorkerPayload>) => {
  const { server, players } = event.data;
  const tiles = mapFactory({ server, players });
  const occupiableOasisTiles = tiles.filter(isUnoccupiedOasisTile);
  const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);
  self.postMessage({ occupiableOasisTiles, occupiedOccupiableTiles });

  const promises = [];
  const chunkedTiles = chunk(tiles, 300);

  for (let i = 0; i < chunkedTiles.length; i += 1) {
    promises.push(database.maps.bulkAdd(chunkedTiles[i]));
  }

  await Promise.all(promises);
  self.close();
});
