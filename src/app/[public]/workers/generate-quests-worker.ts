import { globalQuestsFactory, newVillageQuestsFactory } from 'app/factories/quest-factory';
import { database } from 'database/database';
import type { Quest } from 'interfaces/models/game/quest';
import type { Server } from 'interfaces/models/game/server';
import type { Village } from 'interfaces/models/game/village';

export type GenerateQuestsWorkerPayload = {
  server: Server;
  villageId: Village['id'];
};

export type GenerateQuestsWorkerReturn = {
  quests: Quest[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateQuestsWorkerPayload>) => {
  const { server, villageId } = event.data;
  const villageQuests = newVillageQuestsFactory({ server, villageId });
  const globalQuests = globalQuestsFactory({ server });
  const quests = [...villageQuests, ...globalQuests];
  self.postMessage({ quests });
  await database.quests.bulkAdd(quests);
  self.close();
});
