import { Server } from 'interfaces/models/game/server';
import { globalEffectsFactory, newVillageEffectsFactory, serverEffectsFactory } from 'app/factories/effect-factory';
import { Village } from 'interfaces/models/game/village';
import { database } from 'database/database';
import { Effect } from 'interfaces/models/game/effect';

export type GenerateEffectsWorkerPayload = {
  server: Server;
  village: Village;
};

export type GenerateEffectsWorkerReturn = {
  effects: Effect[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', async (event: MessageEvent<GenerateEffectsWorkerPayload>) => {
  const { server, village } = event.data;
  const serverEffects = serverEffectsFactory({ server });
  const villageEffects = newVillageEffectsFactory({ server, village });
  const globalEffects = globalEffectsFactory({ server });
  const effects = [...serverEffects, ...globalEffects, ...villageEffects];
  self.postMessage({ effects });
  await database.effects.bulkAdd(effects);
  self.close();
});
