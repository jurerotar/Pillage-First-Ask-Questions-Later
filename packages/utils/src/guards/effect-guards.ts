import type {
  ArtifactEffect,
  Effect,
  HeroEffect,
  OasisEffect,
  ServerEffect,
  VillageBuildingEffect,
  VillageEffect,
} from '@pillage-first/types/models/effect';

export const isServerEffect = (effect: Effect): effect is ServerEffect => {
  return effect.scope === 'server';
};

export const isLocalEffect = (effect: Effect): effect is VillageEffect => {
  return effect.scope === 'local';
};

export const isBuildingEffect = (
  effect: Effect,
): effect is VillageBuildingEffect => {
  return isLocalEffect(effect) && effect.source === 'building';
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
