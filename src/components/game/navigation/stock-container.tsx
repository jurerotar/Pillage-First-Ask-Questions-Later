import React, { useEffect, useMemo, useState } from 'react';
import { Resource } from 'interfaces/models/game/resources';
import { useContextSelector } from 'use-context-selector';
import { VillageContext } from 'providers/game/village-context';

type StockContainerProps = {
  resourceType: Resource;
  lastKnownAmount: number;
  hourlyProduction: number;
  storageCapacity: number;
  updatedAt: number;
  hasBorder?: boolean;
};

const StockContainer: React.FC<StockContainerProps> = (props): JSX.Element => {
  const {
    resourceType,
    lastKnownAmount,
    hourlyProduction,
    storageCapacity,
    updatedAt,
    hasBorder = false
  } = props;

  const updateCalculatedResources = useContextSelector(VillageContext, (v) => v.updateCalculatedResources);

  const formatter: Intl.NumberFormat = Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  });

  const [hasHadInitialUpdate, setHasHadInitialUpdate] = useState<boolean>(false);
  const [calculatedCurrentAmount, setCalculatedCurrentAmount] = useState<number>(lastKnownAmount);
  const [isStorageFull, setIsStorageFull] = useState<boolean>(false);

  const resourceUpdateFrequency = useMemo<number>(() => {
    return 3600000 / hourlyProduction;
  }, [hourlyProduction]);

  const formattedCurrentAmount = useMemo<string>(() => {
    return formatter.format(calculatedCurrentAmount);
  }, [calculatedCurrentAmount]);

  // const formattedWarehouseCapacity = useMemo<string>(() => {
  //   return formatter.format(warehouseCapacity);
  // }, [warehouseCapacity]);

  const formattedHourlyProduction = useMemo<string>(() => {
    if (hourlyProduction === 0) {
      return `${hourlyProduction}`;
    }
    return `${hourlyProduction} ${hourlyProduction > 0 ? '+' : '-'}`;
  }, [hourlyProduction]);

  const resourceBarWidth = useMemo<number>(() => {
    if (isStorageFull) {
      return 100;
    }
    return (calculatedCurrentAmount / storageCapacity) * 100;
  }, [calculatedCurrentAmount, storageCapacity]);

  // TODO: Replace with images eventually
  const image = useMemo<string>(() => {
    const images = {
      wood: 'WD',
      iron: 'IRN',
      clay: 'CLY',
      wheat: 'WHE'
    };
    return images[resourceType];
  }, [resourceType]);

  const increaseAmount = (increaseBy: number = 1): void => {
    setCalculatedCurrentAmount((prevState) => {
      if (prevState + increaseBy >= storageCapacity) {
        setIsStorageFull(true);
        return storageCapacity;
      }
      return prevState + increaseBy;
    });
  };

  // Update calculated resource amount in the context, so it's usable by other components
  useEffect(() => {
    updateCalculatedResources(resourceType, calculatedCurrentAmount);
  }, [calculatedCurrentAmount]);

  // First resource update happens sooner or at 'resourceUpdateFrequency'. For example, if we gain an additional resource at every 10s
  // and users opens the server on 5th second, they should only wait 5s for the next update.
  useEffect(() => {
    setIsStorageFull(false);
    setHasHadInitialUpdate(false);
    const millisecondsSinceLastUpdate: number = Date.now() - updatedAt;
    const amountOfGeneratedResourcesSinceLastUpdate: number = Math.floor(millisecondsSinceLastUpdate / resourceUpdateFrequency);
    const millisecondsUntilNextUpdate: number = millisecondsSinceLastUpdate % resourceUpdateFrequency;
    increaseAmount(amountOfGeneratedResourcesSinceLastUpdate);

    const timeoutId = setTimeout(() => {
      setHasHadInitialUpdate(true);
      increaseAmount(1);
    }, millisecondsUntilNextUpdate);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [updatedAt]);

  // Once we have had an initial update, we increase resources in an interval
  useEffect(() => {
    if (!hasHadInitialUpdate) {
      return;
    }
    const intervalId = setInterval(() => {
      increaseAmount(1);
      // Clear interval if storage is full, so we don't do unnecessary calculations
      if (isStorageFull) {
        clearInterval(intervalId);
      }
    }, resourceUpdateFrequency);

    return () => {
      clearInterval(intervalId);
    };
  }, [hasHadInitialUpdate]);

  return (
    <div className={`flex flex-col gap-2 border-gray-150 ${hasBorder && 'border-r pr-2'}`}>
      <div className="flex justify-between items-center gap-2 sm:gap-4 md:gap-6">
        <span className="text-sm font-semibold">
          [
          {image}
          ]
        </span>
        <div className="flex gap-1">
          <span className="text-xs sm:text-sm">
            <span className="sm:font-bold">
              {formattedCurrentAmount}
              <span className="font-normal hidden sm:flex">
                /
              </span>
            </span>
            <span className="font-light text-xs hidden sm:flex">
              {storageCapacity}
            </span>
          </span>
        </div>
      </div>
      <div
        className="rounded-sm bg-gray-200 p-0.5"
        style={{
          boxShadow: 'inset 0 0px 4px 0 rgb(0 0 0 / 0.3)'
        }}
      >
        <div
          className={`flex justify-center w-full h-2 ${isStorageFull ? 'bg-red-500' : 'bg-green-400'}`}
          style={{
            width: `${resourceBarWidth}%`
          }}
        />
      </div>
    </div>
  );
};

export default StockContainer;
