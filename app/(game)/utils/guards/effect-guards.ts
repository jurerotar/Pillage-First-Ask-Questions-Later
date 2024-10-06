import type {
  Effect,
  GlobalEffect,
  HeroEffect,
  ServerEffect,
  TribalEffect,
  VillageBuildingEffect,
  VillageEffect,
  VillageOasisEffect,
} from 'app/interfaces/models/game/effect';

export const isServerEffect = (effect: Effect): effect is ServerEffect => {
  return effect.scope === 'server';
};

export const isGlobalEffect = (effect: Effect): effect is GlobalEffect => {
  return effect.scope === 'global';
};

export const isTribalEffect = (effect: Effect): effect is TribalEffect => {
  return effect.scope === 'global' && effect.source === 'tribe';
};

export const isHeroEffect = (effect: Effect): effect is HeroEffect => {
  return effect.scope === 'global' && effect.source === 'hero';
};

export const isVillageEffect = (effect: Effect): effect is VillageEffect => {
  return effect.scope === 'village';
};

export const isVillageBuildingEffect = (effect: Effect): effect is VillageBuildingEffect => {
  return effect.scope === 'village' && effect.source === 'building';
};

export const isVillageOasisEffect = (effect: Effect): effect is VillageOasisEffect => {
  return effect.scope === 'village' && effect.source === 'oasis';
};
