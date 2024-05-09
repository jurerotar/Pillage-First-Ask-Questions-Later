import { Server } from 'interfaces/models/game/server';
import { globalQuestsFactory, newVillageQuestsFactory } from 'app/[game]/factories/quest-factory';
import { Village } from 'interfaces/models/game/village';
import { database } from 'database/database';
import { Quest } from 'interfaces/models/game/quest';

export type GenerateQuestsWorkerPayload = {
  server: Server;
  village: Village;
};

export type GenerateQuestsWorkerReturn = {
  quests: Quest[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', async (event: MessageEvent<GenerateQuestsWorkerPayload>) => {
  const { server, village } = event.data;
  const villageQuests = newVillageQuestsFactory({ server, village });
  const globalQuests = globalQuestsFactory({ server });
  const quests = [...villageQuests, ...globalQuests];
  self.postMessage({ quests });
  await database.quests.bulkAdd(quests);
  self.close();
});
