import { generateVillages } from 'app/factories/village-factory';
import type { Player } from 'interfaces/models/game/player';
import type { Server } from 'interfaces/models/game/server';
import type { OccupiedOccupiableTile } from 'interfaces/models/game/tile';
import type { Village } from 'interfaces/models/game/village';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';

export type GenerateVillageWorkerPayload = {
  server: Server;
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
  players: Player[];
};

export type GenerateVillageWorkerReturn = {
  villages: Village[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateVillageWorkerPayload>) => {
  const villages = generateVillages(event.data);

  self.postMessage({ villages });

  const serverHandle = await getServerHandle(event.data.server.slug);
  await writeFileContents<Village[]>(serverHandle, 'villages', villages);

  self.close();
});
