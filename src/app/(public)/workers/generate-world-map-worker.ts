import { Server } from 'interfaces/models/game/server';
import { mapFactory } from 'factories/map-factory';

type GenerateWorldMapWorkerPayload = {
  server: Server;
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateWorldMapWorkerPayload>) => {
  const { server } = event.data;
  const tiles = mapFactory({ server });
  self.postMessage({ tiles });
});
