import type {
  ArtifactEffect,
  Effect,
  HeroEffect,
  OasisEffect,
  ResourceProductionEffectId,
  ServerEffect,
  VillageBuildingEffect,
  VillageEffect,
} from '@pillage-first/types/models/effect';

const resourceProductionEffectIds = new Set<Effect['id']>([
  'woodProduction',
  'clayProduction',
  'ironProduction',
  'wheatProduction',
]);

export const isResourceProductionEffectId = (
  effectId: Effect['id'],
): effectId is ResourceProductionEffectId => {
  return resourceProductionEffectIds.has(effectId);
};

export const isAdditiveBonusEffect = (
  effect: Effect,
): effect is Effect & {
  type: 'bonus';
  id: ResourceProductionEffectId;
} => {
  return (
    effect.type === 'bonus' &&
    effect.scope !== 'server' &&
    isResourceProductionEffectId(effect.id)
  );
};

export const isMultiplicativeBonusEffect = (
  effect: Effect,
): effect is Effect & { type: 'bonus' } => {
  return effect.type === 'bonus' && !isAdditiveBonusEffect(effect);
};

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
