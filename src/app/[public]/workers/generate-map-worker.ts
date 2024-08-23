import { isOccupiedOccupiableTile, isUnoccupiedOasisTile } from 'app/[game]/utils/guards/map-guards';
import { mapFactory } from 'app/factories/map-factory';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';
import type { Player } from 'interfaces/models/game/player';
import type { Server } from 'interfaces/models/game/server';
import type { OccupiableOasisTile, OccupiedOccupiableTile, Tile } from 'interfaces/models/game/tile';

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

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<Tile[]>(serverHandle, 'map', tiles);

  self.close();
});
