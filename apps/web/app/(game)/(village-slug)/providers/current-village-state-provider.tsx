import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { Resources } from '@pillage-first/types/models/resource';
import type {
  ComputedEffectReturn,
  WheatProductionEffectReturn,
} from '@pillage-first/utils/game/calculate-computed-effect';
import { useCalculatedResource } from 'app/(game)/(village-slug)/hooks/use-calculated-resource';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';
import { getCurrentTime, subscribeToTimer } from 'app/(game)/utils/timer';

const DAY_IN_MS = 86_400_000;

type CurrentVillageStateContextReturn = Resources & {
  hourlyWoodProduction: number;
  hourlyClayProduction: number;
  hourlyIronProduction: number;
  hourlyWheatProduction: number;
  accumulatedCulturePoints: number;
  culturePointsProduction: number;
  computedWheatProductionEffect: WheatProductionEffectReturn;
  computedWarehouseCapacityEffect: ComputedEffectReturn;
  computedGranaryCapacityEffect: ComputedEffectReturn;
};

export const CurrentVillageStateContext =
  createContext<CurrentVillageStateContextReturn>({} as never);

export const CurrentVillageStateProvider = ({
  children,
}: PropsWithChildren) => {
  const { player } = useMe();
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

  const getCulturePointsSnapshot = useCallback(() => {
    const elapsed = Math.max(
      0,
      getCurrentTime() - player.culturePointsUpdatedAt,
    );

    return Math.floor(
      player.culturePoints +
        (player.culturePointsProduction * elapsed) / DAY_IN_MS,
    );
  }, [
    player.culturePoints,
    player.culturePointsProduction,
    player.culturePointsUpdatedAt,
  ]);

  const getCulturePointsServerSnapshot = useCallback(() => {
    return Math.floor(player.culturePoints);
  }, [player.culturePoints]);

  const accumulatedCulturePoints = useSyncExternalStore(
    subscribeToTimer,
    getCulturePointsSnapshot,
    getCulturePointsServerSnapshot,
  );

  const value = useMemo(
    () => ({
      wood,
      clay,
      iron,
      wheat,
      accumulatedCulturePoints,
      culturePointsProduction: player.culturePointsProduction,
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
      accumulatedCulturePoints,
      player.culturePointsProduction,
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
