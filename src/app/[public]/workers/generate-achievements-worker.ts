import { database } from 'database/database';
import type { Achievement } from 'interfaces/models/game/achievement';
import type { Server } from 'interfaces/models/game/server';

export type GenerateAchievementsWorkerPayload = {
  server: Server;
};

export type GenerateAchievementsWorkerReturn = {
  achievements: Achievement[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateAchievementsWorkerPayload>) => {
  const { server: _server } = event.data;
  const achievements: Achievement[] = [];
  self.postMessage({ achievements });
  await database.achievements.bulkAdd(achievements);
  self.close();
});
