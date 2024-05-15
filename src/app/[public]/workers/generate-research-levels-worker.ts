import { researchLevelsFactory } from 'app/factories/research-levels-factory';
import { database } from 'database/database';
import type { ResearchLevel } from 'interfaces/models/game/research-level';
import type { Server } from 'interfaces/models/game/server';

export type GenerateResearchLevelsWorkerPayload = {
  server: Server;
};

export type GenerateResearchLevelsWorkerReturn = {
  researchLevels: ResearchLevel[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateResearchLevelsWorkerPayload>) => {
  const { server } = event.data;
  const researchLevels = researchLevelsFactory({ server });
  self.postMessage({ researchLevels });
  await database.researchLevels.bulkAdd(researchLevels);
  self.close();
});
