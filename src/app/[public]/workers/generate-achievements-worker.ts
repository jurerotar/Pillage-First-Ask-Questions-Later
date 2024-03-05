import { Server } from 'interfaces/models/game/server';
import { Achievement } from 'interfaces/models/game/achievement';

export type GenerateAchievementsWorkerPayload = {
  server: Server;
};

export type GenerateAchievementsWorkerReturn = {
  achievements: Achievement[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateAchievementsWorkerPayload>) => {
  const { server } = event.data;
  const achievements: Achievement[] = [];
  self.postMessage({ achievements });
  self.close();
});
