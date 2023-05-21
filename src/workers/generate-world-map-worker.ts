import { MapGeneratorService } from 'services/map-generator-service';
import { Server } from 'interfaces/models/game/server';

type GenerateWorldMapWorkerPayload = [Server];

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateWorldMapWorkerPayload>) => {
  const [server] = event.data;
  const tiles = MapGeneratorService.generateMap(server);
  self.postMessage({ tiles });
});
