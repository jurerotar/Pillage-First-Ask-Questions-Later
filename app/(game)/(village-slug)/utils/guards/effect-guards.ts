import type { Effect, GlobalEffect, ServerEffect, VillageEffect } from 'app/interfaces/models/game/effect';

export const isServerEffect = (effect: Effect): effect is ServerEffect => {
  return effect.scope === 'server';
};

export const isGlobalEffect = (effect: Effect): effect is GlobalEffect => {
  return effect.scope === 'global';
};

export const isVillageEffect = (effect: Effect): effect is VillageEffect => {
  return effect.scope === 'village';
};
