import { type PropsWithChildren, useMemo } from 'react';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { CurrentVillageComputedEffectsContext } from 'app/(game)/(village-slug)/providers/current-village-computed-effects-context';

export const CurrentVillageComputedEffectsProvider = ({
  children,
}: PropsWithChildren) => {
  const computedWheatProductionEffect = useComputedEffect('wheatProduction');
  const computedWarehouseCapacityEffect =
    useComputedEffect('warehouseCapacity');
  const computedGranaryCapacityEffect = useComputedEffect('granaryCapacity');
  const { total: hourlyWoodProduction } = useComputedEffect('woodProduction');
  const { total: hourlyClayProduction } = useComputedEffect('clayProduction');
  const { total: hourlyIronProduction } = useComputedEffect('ironProduction');
  const { total: hourlyWheatProduction } = computedWheatProductionEffect;

  const computedEffectsValue = useMemo(
    () => ({
      hourlyWoodProduction: Math.trunc(hourlyWoodProduction),
      hourlyClayProduction: Math.trunc(hourlyClayProduction),
      hourlyIronProduction: Math.trunc(hourlyIronProduction),
      hourlyWheatProduction: Math.trunc(hourlyWheatProduction),
      computedWheatProductionEffect,
      computedWarehouseCapacityEffect,
      computedGranaryCapacityEffect,
    }),
    [
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
    <CurrentVillageComputedEffectsContext value={computedEffectsValue}>
      {children}
    </CurrentVillageComputedEffectsContext>
  );
};
