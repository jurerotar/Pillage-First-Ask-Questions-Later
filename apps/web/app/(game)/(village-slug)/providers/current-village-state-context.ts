import { createContext } from 'react';
import type { Resources } from '@pillage-first/types/models/resource';
import type {
  ComputedEffectReturn,
  WheatProductionEffectReturn,
} from '@pillage-first/utils/game/calculate-computed-effect';

export type CurrentVillageStateContextReturn = Resources & {
  hourlyWoodProduction: number;
  hourlyClayProduction: number;
  hourlyIronProduction: number;
  hourlyWheatProduction: number;
  computedWheatProductionEffect: WheatProductionEffectReturn;
  computedWarehouseCapacityEffect: ComputedEffectReturn;
  computedGranaryCapacityEffect: ComputedEffectReturn;
};

export const CurrentVillageStateContext =
  createContext<CurrentVillageStateContextReturn>({} as never);
