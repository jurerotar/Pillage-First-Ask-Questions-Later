import { type PropsWithChildren, useMemo } from 'react';
import { useCalculatedResource } from 'app/(game)/(village-slug)/hooks/use-calculated-resource';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-context';

export const CurrentVillageStateProvider = ({
  children,
}: PropsWithChildren) => {
  const computedWheatProductionEffect = useComputedEffect('wheatProduction');
  const computedWarehouseCapacityEffect =
    useComputedEffect('warehouseCapacity');
  const computedGranaryCapacityEffect = useComputedEffect('granaryCapacity');
  const {
    calculatedResourceAmount: wood,
    hourlyProduction: hourlyWoodProduction,
  } = useCalculatedResource('wood', computedWarehouseCapacityEffect.total);
  const {
    calculatedResourceAmount: clay,
    hourlyProduction: hourlyClayProduction,
  } = useCalculatedResource('clay', computedWarehouseCapacityEffect.total);
  const {
    calculatedResourceAmount: iron,
    hourlyProduction: hourlyIronProduction,
  } = useCalculatedResource('iron', computedWarehouseCapacityEffect.total);
  const {
    calculatedResourceAmount: wheat,
    hourlyProduction: hourlyWheatProduction,
  } = useCalculatedResource('wheat', computedGranaryCapacityEffect.total);

  const value = useMemo(
    () => ({
      wood,
      clay,
      iron,
      wheat,
      hourlyWoodProduction,
      hourlyClayProduction,
      hourlyIronProduction,
      hourlyWheatProduction,
      computedWheatProductionEffect,
      computedWarehouseCapacityEffect,
      computedGranaryCapacityEffect,
    }),
    [
      wood,
      clay,
      iron,
      wheat,
      hourlyWoodProduction,
      hourlyClayProduction,
      hourlyIronProduction,
      hourlyWheatProduction,
      computedWheatProductionEffect,
      computedWarehouseCapacityEffect,
      computedGranaryCapacityEffect,
    ],
  );

  return (
    <CurrentVillageStateContext value={value}>
      {children}
    </CurrentVillageStateContext>
  );
};
