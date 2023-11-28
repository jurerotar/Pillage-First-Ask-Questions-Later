import { Server } from 'interfaces/models/game/server';
import { Quest } from 'interfaces/models/game/quest';
import { globalQuestsFactory, newVillageQuestsFactory } from 'factories/quest-factory';
import { Village } from 'interfaces/models/game/village';

export type GenerateQuestsWorkerPayload = {
  server: Server;
  village: Village;
};

export type GenerateQuestsWorkerReturn = {
  quests: Quest[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateQuestsWorkerPayload>) => {
  const { server, village } = event.data;
  const villageQuests = newVillageQuestsFactory({ server, village });
  const globalQuests = globalQuestsFactory({ server });
  const quests = [...villageQuests, globalQuests];
  self.postMessage({ quests });
});
