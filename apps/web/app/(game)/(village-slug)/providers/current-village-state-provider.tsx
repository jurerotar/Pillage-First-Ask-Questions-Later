import { createContext, type PropsWithChildren } from 'react';
import type { Resources } from '@pillage-first/types/models/resource';
import type {
  ComputedEffectReturn,
  WheatProductionEffectReturn,
} from '@pillage-first/utils/game/calculate-computed-effect';
import { useCalculatedResource } from 'app/(game)/(village-slug)/hooks/use-calculated-resource';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';

type CurrentVillageStateContextReturn = Resources & {
  computedWheatProductionEffect: WheatProductionEffectReturn;
  computedWarehouseCapacityEffect: ComputedEffectReturn;
  computedGranaryCapacityEffect: ComputedEffectReturn;
};

export const CurrentVillageStateContext =
  createContext<CurrentVillageStateContextReturn>({} as never);

export const CurrentVillageStateProvider = ({
  children,
}: PropsWithChildren) => {
  const computedWheatProductionEffect = useComputedEffect('wheatProduction');
  const computedWarehouseCapacityEffect =
    useComputedEffect('warehouseCapacity');
  const computedGranaryCapacityEffect = useComputedEffect('granaryCapacity');
  const { calculatedResourceAmount: wood } = useCalculatedResource(
    'wood',
    computedWarehouseCapacityEffect.total,
  );
  const { calculatedResourceAmount: clay } = useCalculatedResource(
    'clay',
    computedWarehouseCapacityEffect.total,
  );
  const { calculatedResourceAmount: iron } = useCalculatedResource(
    'iron',
    computedWarehouseCapacityEffect.total,
  );
  const { calculatedResourceAmount: wheat } = useCalculatedResource(
    'wheat',
    computedGranaryCapacityEffect.total,
  );

  const value = {
    wood,
    clay,
    iron,
    wheat,
    computedWheatProductionEffect,
    computedWarehouseCapacityEffect,
    computedGranaryCapacityEffect,
  };

  return (
    <CurrentVillageStateContext value={value}>
      {children}
    </CurrentVillageStateContext>
  );
};
