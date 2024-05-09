import { Server } from 'interfaces/models/game/server';
import { Achievement } from 'interfaces/models/game/achievement';
import { database } from 'database/database';

export type GenerateAchievementsWorkerPayload = {
  server: Server;
};

export type GenerateAchievementsWorkerReturn = {
  achievements: Achievement[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', async (event: MessageEvent<GenerateAchievementsWorkerPayload>) => {
  const { server } = event.data;
  const achievements: Achievement[] = [];
  self.postMessage({ achievements });
  await database.achievements.bulkAdd(achievements);
  self.close();
});
