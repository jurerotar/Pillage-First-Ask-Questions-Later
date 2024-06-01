import { globalQuestsFactory, newVillageQuestsFactory } from 'app/factories/quest-factory';
import type { Quest } from 'interfaces/models/game/quest';
import type { Server } from 'interfaces/models/game/server';
import type { Village } from 'interfaces/models/game/village';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';

export type GenerateQuestsWorkerPayload = {
  server: Server;
  villageId: Village['id'];
};

export type GenerateQuestsWorkerReturn = {
  quests: Quest[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateQuestsWorkerPayload>) => {
  const { server, villageId } = event.data;
  const villageQuests = newVillageQuestsFactory({ villageId });
  const globalQuests = globalQuestsFactory();
  const quests = [...villageQuests, ...globalQuests];
  self.postMessage({ quests });

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<Quest[]>(serverHandle, 'quests', quests);

  self.close();
});
