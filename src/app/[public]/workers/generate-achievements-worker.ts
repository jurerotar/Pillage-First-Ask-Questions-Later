import type { Achievement } from 'interfaces/models/game/achievement';
import type { Server } from 'interfaces/models/game/server';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';

export type GenerateAchievementsWorkerPayload = {
  server: Server;
};

export type GenerateAchievementsWorkerReturn = {
  achievements: Achievement[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateAchievementsWorkerPayload>) => {
  const { server } = event.data;
  const achievements: Achievement[] = [];
  self.postMessage({ achievements });

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<Achievement[]>(serverHandle, 'achievements', achievements);

  self.close();
});
