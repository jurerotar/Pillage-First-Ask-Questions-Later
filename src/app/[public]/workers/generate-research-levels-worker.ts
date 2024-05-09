import { Server } from 'interfaces/models/game/server';
import { database } from 'database/database';
import { researchLevelsFactory } from 'app/factories/research-levels-factory';
import { ResearchLevel } from 'interfaces/models/game/research-level';

export type GenerateResearchLevelsWorkerPayload = {
  server: Server;
};

export type GenerateResearchLevelsWorkerReturn = {
  researchLevels: ResearchLevel[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', async (event: MessageEvent<GenerateResearchLevelsWorkerPayload>) => {
  const { server } = event.data;
  const researchLevels = researchLevelsFactory({ server });
  self.postMessage({ researchLevels });
  await database.researchLevels.bulkAdd(researchLevels);
  self.close();
});
