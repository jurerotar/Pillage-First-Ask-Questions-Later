import {
  Effect,
  GlobalEffect,
  HeroEffect,
  ServerEffect,
  TribalEffect,
  VillageBuildingEffect,
  VillageEffect,
  VillageOasisEffect,
} from 'interfaces/models/game/effect';

export const serverEffectGuard = (effect: Effect): effect is ServerEffect => {
  return effect.scope === 'server';
};

export const globalEffectGuard = (effect: Effect): effect is GlobalEffect => {
  return effect.scope === 'global';
};

export const tribalEffectGuard = (effect: Effect): effect is TribalEffect => {
  return effect.scope === 'global' && effect.source === 'tribe';
};

export const heroEffectGuard = (effect: Effect): effect is HeroEffect => {
  return effect.scope === 'global' && effect.source === 'hero';
};

export const villageEffectGuard = (effect: Effect): effect is VillageEffect => {
  return effect.scope === 'village';
};

export const villageBuildingEffectGuard = (effect: Effect): effect is VillageBuildingEffect => {
  return effect.scope === 'village' && effect.source === 'building';
};

export const villageOasisEffectGuard = (effect: Effect): effect is VillageOasisEffect => {
  return effect.scope === 'village' && effect.source === 'oasis';
};
