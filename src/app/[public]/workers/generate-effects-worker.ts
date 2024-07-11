import { generateEffects } from 'app/factories/effect-factory';
import type { Effect } from 'interfaces/models/game/effect';
import type { Server } from 'interfaces/models/game/server';
import type { Village } from 'interfaces/models/game/village';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';

export type GenerateEffectsWorkerPayload = {
  server: Server;
  village: Village;
};

export type GenerateEffectsWorkerReturn = {
  effects: Effect[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateEffectsWorkerPayload>) => {
  const { server, village } = event.data;

  const effects = generateEffects(server, village);

  self.postMessage({ effects });

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<Effect[]>(serverHandle, 'effects', effects);

  self.close();
});
