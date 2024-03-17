import { Server } from 'interfaces/models/game/server';
import { Effect } from 'interfaces/models/game/effect';
import { globalEffects, villageEffects } from 'assets/effects';
import { Village } from 'interfaces/models/game/village';

type EffectFactoryProps = {
  server: Server;
};

export const effectFactory = (args: Omit<Effect, 'id'>): Effect => {
  const id = crypto.randomUUID();

  return {
    id,
    ...args,
  };
};

export const newVillageEffectsFactory = ({ server, village }: EffectFactoryProps & { village: Village }): Effect[] => {
  return villageEffects.map((effect) => effectFactory({ server, ...effect }));
};

export const globalEffectsFactory = ({ server }: EffectFactoryProps): Effect[] => {
  return globalEffects.map((effect) => effectFactory({ server, ...effect }));
};
