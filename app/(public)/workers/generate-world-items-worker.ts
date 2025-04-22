import type { OccupiedOccupiableTile } from 'app/interfaces/models/game/tile';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { worldItemsFactory } from 'app/factories/world-items-factory';
import type { Server } from 'app/interfaces/models/game/server';
import { prngAlea } from 'ts-seedrandom';

export type GenerateWorldItemsWorkerPayload = {
  server: Server;
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
};

export type GenerateWorldItemsWorkerReturn = {
  worldItems: WorldItem[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateWorldItemsWorkerPayload>) => {
  const { server } = event.data;
  const prng = prngAlea(server.seed);

  const worldItems = worldItemsFactory({ prng, ...event.data });

  self.postMessage({ worldItems } satisfies GenerateWorldItemsWorkerReturn);
  self.close();
});
