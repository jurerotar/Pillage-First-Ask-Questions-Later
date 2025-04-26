import { isOccupiedOccupiableTile, isUnoccupiedOasisTile } from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { mapFactory } from 'app/factories/map-factory';
import type { Player } from 'app/interfaces/models/game/player';
import type { Server } from 'app/interfaces/models/game/server';
import type { OasisTile, OccupiedOccupiableTile, Tile } from 'app/interfaces/models/game/tile';

export type GenerateMapWorkerPayload = {
  server: Server;
  npcPlayers: Player[];
};

export type GenerateMapWorkerReturn = {
  tiles: Tile[];
  occupiableOasisTiles: OasisTile[];
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateMapWorkerPayload>) => {
  const { server, npcPlayers } = event.data;
  const tiles = mapFactory({ server, npcPlayers });
  const occupiableOasisTiles = tiles.filter(isUnoccupiedOasisTile);
  const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);
  self.postMessage({ tiles, occupiableOasisTiles, occupiedOccupiableTiles } satisfies GenerateMapWorkerReturn);
  self.close();
});
