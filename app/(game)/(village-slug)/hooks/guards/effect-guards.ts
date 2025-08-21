import type {
  ArtifactEffect,
  Effect,
  GlobalEffect,
  HeroEffect,
  OasisEffect,
  ServerEffect,
  VillageBuildingEffect,
  VillageEffect,
} from 'app/interfaces/models/game/effect';

export const isGlobalEffect = (effect: Effect): effect is GlobalEffect => {
  return effect.scope === 'global';
};

export const isServerEffect = (effect: Effect): effect is ServerEffect => {
  return effect.scope === 'server';
};

export const isVillageEffect = (effect: Effect): effect is VillageEffect => {
  return effect.scope === 'village';
};

export const isBuildingEffect = (
  effect: Effect,
): effect is VillageBuildingEffect => {
  return isVillageEffect(effect) && effect.source === 'building';
};

export const isArtifactEffect = (effect: Effect): effect is ArtifactEffect => {
  return effect.source === 'artifact';
};

export const isHeroEffect = (effect: Effect): effect is HeroEffect => {
  return effect.source === 'hero';
};

export const isOasisEffect = (effect: Effect): effect is OasisEffect => {
  return effect.source === 'oasis';
};
