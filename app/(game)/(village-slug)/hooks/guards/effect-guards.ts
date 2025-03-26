import type { Effect, VillageBuildingEffect } from 'app/interfaces/models/game/effect';

export const isBuildingEffect = (effect: Effect): effect is VillageBuildingEffect => {
  return effect.scope === 'village' && effect.source === 'building';
};
