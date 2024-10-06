import { generateTroops } from 'app/factories/troop-factory';
import type { Player } from 'app/interfaces/models/game/player';
import type { Server } from 'app/interfaces/models/game/server';
import type { OccupiableOasisTile, OccupiedOccupiableTile } from 'app/interfaces/models/game/tile';
import type { Troop } from 'app/interfaces/models/game/troop';

export type GenerateTroopsWorkerPayload = {
  server: Server;
  occupiableOasisTiles: OccupiableOasisTile[];
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
  players: Player[];
};

export type GenerateTroopsWorkerReturn = {
  troops: Troop[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateTroopsWorkerPayload>) => {
  const troops = generateTroops(event.data);
  self.postMessage({ troops });
  self.close();
});
