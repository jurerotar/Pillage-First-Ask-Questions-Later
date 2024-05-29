import { isOccupiedOccupiableTile, isUnoccupiedOasisTile } from 'app/[game]/utils/guards/map-guards';
import { mapFactory } from 'app/factories/map-factory';
import { database } from 'database/database';
import type { Player } from 'interfaces/models/game/player';
import type { Server } from 'interfaces/models/game/server';
import type { OccupiableOasisTile, OccupiedOccupiableTile } from 'interfaces/models/game/tile';
import { chunk } from 'moderndash';

export type GenerateMapWorkerPayload = {
  server: Server;
  players: Player[];
};

export type GenerateMapWorkerReturn = {
  occupiableOasisTiles: OccupiableOasisTile[];
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateMapWorkerPayload>) => {
  const { server, players } = event.data;
  const tiles = mapFactory({ server, players });
  const occupiableOasisTiles = tiles.filter(isUnoccupiedOasisTile);
  const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);
  self.postMessage({ occupiableOasisTiles, occupiedOccupiableTiles });

  const promises = [];
  const chunkedTiles = chunk(tiles, 3000);

  for (let i = 0; i < chunkedTiles.length; i += 1) {
    promises.push(database.maps.bulkAdd(chunkedTiles[i]));
  }

  await Promise.all(promises);
  self.close();
});
