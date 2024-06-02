import type { Server } from 'interfaces/models/game/server';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';
import type { MapFilters } from 'interfaces/models/game/map-filters';
import { mapFiltersFactory } from 'app/factories/map-filters-factory';

export type GenerateMapFiltersWorkerPayload = {
  server: Server;
};

export type GenerateMapFiltersWorkerReturn = {
  MapFilters: MapFilters;
};

self.addEventListener('message', async (event: MessageEvent<GenerateMapFiltersWorkerPayload>) => {
  const { server } = event.data;
  const mapFilters = mapFiltersFactory();

  self.postMessage({ mapFilters });

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<MapFilters>(serverHandle, 'mapFilters', mapFilters);

  self.close();
});
