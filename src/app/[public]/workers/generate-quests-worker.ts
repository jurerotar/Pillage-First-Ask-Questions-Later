import { Server } from 'interfaces/models/game/server';
import { globalQuestsFactory, newVillageQuestsFactory } from 'app/factories/quest-factory';
import { Village } from 'interfaces/models/game/village';
import { database } from 'database/database';
import { Quest } from 'interfaces/models/game/quest';

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
