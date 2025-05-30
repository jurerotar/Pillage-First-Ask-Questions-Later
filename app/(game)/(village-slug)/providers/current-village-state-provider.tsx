import { useCalculatedResource } from 'app/(game)/(village-slug)/hooks/use-calculated-resource';
import type { Resources } from 'app/interfaces/models/game/resource';
import type React from 'react';
import { createContext } from 'react';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import type { ComputedEffectReturn, WheatProductionEffectReturn } from 'app/(game)/utils/calculate-computed-effect';

type CurrentVillageStateContextReturn = Resources & {
  computedWheatProductionEffect: WheatProductionEffectReturn;
  computedWarehouseCapacityEffect: ComputedEffectReturn;
  computedGranaryCapacityEffect: ComputedEffectReturn;
};

export const CurrentVillageStateContext = createContext<CurrentVillageStateContextReturn>({} as never);

export const CurrentVillageStateProvider: React.FCWithChildren = ({ children }) => {
  const computedWheatProductionEffect = useComputedEffect('wheatProduction');
  const computedWarehouseCapacityEffect = useComputedEffect('warehouseCapacity');
  const computedGranaryCapacityEffect = useComputedEffect('granaryCapacity');
  const { calculatedResourceAmount: wood } = useCalculatedResource('wood', computedWarehouseCapacityEffect.total);
  const { calculatedResourceAmount: clay } = useCalculatedResource('clay', computedWarehouseCapacityEffect.total);
  const { calculatedResourceAmount: iron } = useCalculatedResource('iron', computedWarehouseCapacityEffect.total);
  const { calculatedResourceAmount: wheat } = useCalculatedResource('wheat', computedGranaryCapacityEffect.total);

  const value = {
    wood,
    clay,
    iron,
    wheat,
    computedWheatProductionEffect,
    computedWarehouseCapacityEffect,
    computedGranaryCapacityEffect,
  };

  return <CurrentVillageStateContext value={value}>{children}</CurrentVillageStateContext>;
};
