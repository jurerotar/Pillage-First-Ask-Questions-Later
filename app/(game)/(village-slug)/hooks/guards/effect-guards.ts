import type { ArtifactEffect, Effect, HeroEffect, VillageBuildingEffect, VillageEffect } from 'app/interfaces/models/game/effect';

export const isVillageEffect = (effect: Effect): effect is VillageEffect => {
  return effect.scope === 'village';
};

export const isBuildingEffect = (effect: Effect): effect is VillageBuildingEffect => {
  return isVillageEffect(effect) && effect.source === 'building';
};

export const isArtifactEffect = (effect: Effect): effect is ArtifactEffect => {
  return effect.source === 'artifact';
};

export const isHeroEffect = (effect: Effect): effect is HeroEffect => {
  return effect.source === 'hero';
};

