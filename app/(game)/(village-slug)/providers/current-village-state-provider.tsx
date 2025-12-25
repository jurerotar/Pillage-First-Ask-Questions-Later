import type { PropsWithChildren } from 'react';
import { createContext } from 'react';
import { useCalculatedResource } from 'app/(game)/(village-slug)/hooks/use-calculated-resource';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import type {
  ComputedEffectReturn,
  WheatProductionEffectReturn,
} from 'app/(game)/utils/calculate-computed-effect';
import type { Resources } from 'app/interfaces/models/game/resource';

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
