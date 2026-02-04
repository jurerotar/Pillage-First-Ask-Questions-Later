import { z } from 'zod';
import type { Building } from './building';
import type { Village } from './village';

export type TroopTrainingDurationEffectId =
  | 'barracksTrainingDuration'
  | 'greatBarracksTrainingDuration'
  | 'stableTrainingDuration'
  | 'greatStableTrainingDuration'
  | 'workshopTrainingDuration'
  | 'hospitalTrainingDuration';

export type ResourceProductionEffectId =
  | 'woodProduction'
  | 'clayProduction'
  | 'ironProduction'
  | 'wheatProduction';

export type EffectId =
  | 'attack'
  | 'defence'
  | 'defenceBonus'
  | 'infantryDefence'
  | 'cavalryDefence'
  | 'warehouseCapacity'
  | 'granaryCapacity'
  | 'unitSpeed'
  | 'unitSpeedAfter20Fields'
  | 'unitWheatConsumption'
  | 'unitCarryCapacity'
  | 'buildingDuration'
  | 'unitResearchDuration'
  | 'unitImprovementDuration'
  | 'merchantSpeed'
  | 'merchantCapacity'
  | 'merchantAmount'
  | 'crannyCapacity'
  | 'trapperCapacity'
  | 'revealedIncomingTroopsAmount'
  | ResourceProductionEffectId
  | TroopTrainingDurationEffectId;

// 'server' and 'global' scopes both affect global scope, but the calculation requires differentiation between them
export const effectScopeSchema = z
  .enum(['global', 'village', 'server'])
  .meta({ id: 'EffectScope' });
export const effectSourceSchema = z
  .enum(['hero', 'oasis', 'artifact', 'building', 'tribe', 'server', 'troops'])
  .meta({ id: 'EffectSource' });
export const effectTypeSchema = z
  .enum(['base', 'bonus', 'bonus-booster'])
  .meta({ id: 'EffectType' });

export const effectIdSchema = z
  .string()
  .pipe(z.custom<EffectId>())
  .meta({ id: 'EffectId' });

export const effectSchema = z
  .strictObject({
    id: effectIdSchema,
    value: z.number(),
    type: effectTypeSchema,
    scope: effectScopeSchema,
    source: effectSourceSchema,
    villageId: z.number().nullable().optional(),
    sourceSpecifier: z.number().nullable(),
  })
  .meta({ id: 'Effect' });

export type Effect = z.infer<typeof effectSchema>;

export type ServerEffect = Omit<Effect, 'scope'> & {
  scope: 'server';
};

export type GlobalEffect = Omit<Effect, 'scope' | 'source'> & {
  scope: 'global';
  source: 'hero' | 'tribe' | 'artifact' | 'building';
};

export type TribalEffect = Omit<GlobalEffect, 'source'> & {
  source: 'tribe';
};

export type VillageEffect = Omit<Effect, 'scope' | 'source'> & {
  scope: 'village';
  source: 'building' | 'oasis' | 'server' | 'troops' | 'hero';
  villageId: Village['id'];
};

export type HeroEffect = Omit<VillageEffect, 'source'> & {
  source: 'hero';
};

export type VillageBuildingEffect = Omit<VillageEffect, 'source'> & {
  source: 'building' | 'oasis';
  buildingId: Building['id'];
};

export type ArtifactEffect = Omit<VillageEffect, 'source'> & {
  source: 'artifact';
};

export type OasisEffect = Omit<VillageEffect, 'source'> & {
  source: 'oasis';
};
