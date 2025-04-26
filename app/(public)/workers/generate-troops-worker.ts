import { generateTroops } from 'app/factories/troop-factory';
import type { Player } from 'app/interfaces/models/game/player';
import type { Server } from 'app/interfaces/models/game/server';
import type { OasisTile, OccupiedOccupiableTile } from 'app/interfaces/models/game/tile';
import type { Troop } from 'app/interfaces/models/game/troop';

export type GenerateTroopsWorkerPayload = {
  server: Server;
  occupiableOasisTiles: OasisTile[];
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
  players: Player[];
};

export type GenerateTroopsWorkerReturn = {
  playerTroops: Troop[];
  npcTroops: Troop[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateTroopsWorkerPayload>) => {
  const { playerTroops, npcTroops } = generateTroops(event.data);
  self.postMessage({ playerTroops, npcTroops } satisfies GenerateTroopsWorkerReturn);
  self.close();
});
