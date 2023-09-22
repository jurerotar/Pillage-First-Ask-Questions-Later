import { Tile } from 'interfaces/models/game/tile';
import { Village } from 'interfaces/models/game/village';
import { Server } from 'interfaces/models/game/server';

type GenerateWorldMapWorkerPayload = {
  server: Server;
  tiles: Tile[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateWorldMapWorkerPayload>) => {
  const { server, tiles } = event.data;
  const villages: Village[] = [{ serverId: server.id }];
  self.postMessage({ villages });
});
