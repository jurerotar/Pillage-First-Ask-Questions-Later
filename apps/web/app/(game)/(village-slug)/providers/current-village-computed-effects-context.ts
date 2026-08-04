import { createContext } from 'react';
import type {
  ComputedEffectReturn,
  WheatProductionEffectReturn,
} from '@pillage-first/utils/game/calculate-computed-effect';

export type CurrentVillageComputedEffectsContextReturn = {
  hourlyWoodProduction: number;
  hourlyClayProduction: number;
  hourlyIronProduction: number;
  hourlyWheatProduction: number;
  computedWheatProductionEffect: WheatProductionEffectReturn;
  computedWarehouseCapacityEffect: ComputedEffectReturn;
  computedGranaryCapacityEffect: ComputedEffectReturn;
};

export const CurrentVillageComputedEffectsContext =
  createContext<CurrentVillageComputedEffectsContextReturn>({} as never);
