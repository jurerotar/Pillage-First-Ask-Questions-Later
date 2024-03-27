import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { Resource } from 'interfaces/models/game/resource';
import { useComputedEffect } from 'app/[game]/hooks/use-computed-effect';
import { ResourceProductionEffectId } from 'interfaces/models/game/effect';
import { useEffect, useRef, useState } from 'react';
import { Village } from 'interfaces/models/game/village';
import dayjs from 'dayjs';

const resourceToResourceEffectMap = new Map<Resource, ResourceProductionEffectId>([
  ['wood', 'woodProduction'],
  ['clay', 'clayProduction'],
  ['iron', 'ironProduction'],
  ['wheat', 'wheatProduction'],
]);

type CalculateCurrentAmountArgs = {
  lastUpdatedAt: Village['lastUpdatedAt'];
  resourceAmount: number;
  hourlyProduction: number;
  storageCapacity: number;
};

const calculateCurrentAmount = ({ lastUpdatedAt, resourceAmount, hourlyProduction, storageCapacity }: CalculateCurrentAmountArgs) => {
  const secondsForResourceGeneration = 3600 / hourlyProduction;
  const timeSinceLastUpdateInSeconds = dayjs().diff(dayjs(lastUpdatedAt), 'second');
  const producedResources = Math.floor(timeSinceLastUpdateInSeconds / secondsForResourceGeneration);
  const calculatedCurrentAmount = Math.min(resourceAmount + producedResources, storageCapacity);

  return {
    timeSinceLastUpdateInSeconds,
    secondsForResourceGeneration,
    calculatedCurrentAmount,
  };
};

export const useCurrentResources = (resource: Resource) => {
  const {
    currentVillage: { resources, lastUpdatedAt },
  } = useCurrentVillage();
  const resourceAmount = resources[resource];
  const { total: hourlyProduction } = useComputedEffect(resourceToResourceEffectMap.get(resource)!);
  const { total: storageCapacity } = useComputedEffect(resource === 'wheat' ? 'granaryCapacity' : 'warehouseCapacity');

  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  const { timeSinceLastUpdateInSeconds, secondsForResourceGeneration, calculatedCurrentAmount } = calculateCurrentAmount({
    lastUpdatedAt,
    resourceAmount,
    storageCapacity,
    hourlyProduction,
  });

  const [calculatedResourceAmount, setCalculatedResourceAmount] = useState<number>(calculatedCurrentAmount);
  const [hasSetInitialResourceUnit, setHasSetInitialResourceUnit] = useState<boolean>(false);

  const hasNegativeProduction = hourlyProduction < 0;
  const isFull = calculatedResourceAmount === storageCapacity;

  useEffect(() => {
    if (isFull || hasSetInitialResourceUnit) {
      if (timeoutId.current !== null) {
        clearTimeout(timeoutId.current!);
      }
      return;
    }

    timeoutId.current = setTimeout(
      () => {
        setHasSetInitialResourceUnit(true);
        clearTimeout(timeoutId.current!);
        setCalculatedResourceAmount((prevState) => Math.min(prevState + 1, storageCapacity));
      },
      (secondsForResourceGeneration - (timeSinceLastUpdateInSeconds % secondsForResourceGeneration)) * 1000
    );

    return () => clearTimeout(timeoutId.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdatedAt, hourlyProduction, storageCapacity, hasSetInitialResourceUnit]);

  useEffect(() => {
    if (isFull || !hasSetInitialResourceUnit) {
      if (intervalId.current !== null) {
        clearInterval(intervalId.current!);
      }
      return;
    }

    intervalId.current = setInterval(() => {
      setCalculatedResourceAmount((prevState) => Math.min(prevState + 1, storageCapacity));
    }, secondsForResourceGeneration * 1000);

    return () => clearInterval(intervalId.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdatedAt, hourlyProduction, storageCapacity, hasSetInitialResourceUnit]);

  return {
    calculatedResourceAmount,
    hourlyProduction,
    storageCapacity,
    isFull,
    hasNegativeProduction,
  };
};
