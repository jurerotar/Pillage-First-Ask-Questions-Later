import { MapGeneratorService } from 'services/map-generator-service';

type GenerateWorldMapWorkerPayload = [number, string];

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateWorldMapWorkerPayload>) => {
  const [size, seed] = event.data;
  const tiles = MapGeneratorService.generateMap(size, seed);
  self.postMessage({ tiles });
});
