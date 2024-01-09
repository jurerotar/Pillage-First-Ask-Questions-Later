import { Server } from 'interfaces/models/game/server';
import { Effect } from 'interfaces/models/game/effect';
import { globalEffects, villageEffects } from 'assets/effects';
import { Village } from 'interfaces/models/game/village';

type EffectFactoryProps = {
  server: Server;
};

export const effectFactory = ({ server, ...effect }: EffectFactoryProps & Omit<Effect, 'serverId'>): Effect => {
  return {
    serverId: server.id,
    ...effect,
  };
};

export const newVillageEffectsFactory = ({ server, village }: EffectFactoryProps & { village: Village }): Effect[] => {
  return villageEffects.map((effect) => effectFactory({ server, ...effect }));
};

export const globalEffectsFactory = ({ server }: EffectFactoryProps): Effect[] => {
  return globalEffects.map((effect) => effectFactory({ server, ...effect }));
};