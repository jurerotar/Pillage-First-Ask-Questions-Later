import { Server } from 'interfaces/models/game/server';
import { globalEffectsFactory, newVillageEffectsFactory } from 'app/[game]/factories/effect-factory';
import { Village } from 'interfaces/models/game/village';
import { Effect } from 'interfaces/models/game/effect';

export type GenerateEffectsWorkerPayload = {
  server: Server;
  village: Village;
};

export type GenerateEffectsWorkerReturn = {
  effects: Effect[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateEffectsWorkerPayload>) => {
  const { server, village } = event.data;
  const villageEffects = newVillageEffectsFactory({ server, village });
  const globalEffects = globalEffectsFactory({ server });
  const effects = [...villageEffects, globalEffects];
  self.postMessage({ effects });
  self.close();
});
