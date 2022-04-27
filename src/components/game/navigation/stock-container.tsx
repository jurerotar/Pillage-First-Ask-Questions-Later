import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Resource } from 'interfaces/models/game/resources';

type StockContainerProps = {
  resourceType: Resource;
  lastKnownAmount: number;
  hourlyProduction: number;
  storageCapacity: number;
  updatedAt: number;
};

const StockContainer: React.FC<StockContainerProps> = (props): JSX.Element => {
  const {
    resourceType,
    lastKnownAmount,
    hourlyProduction,
    storageCapacity,
    updatedAt
  } = props;

  const formatter: Intl.NumberFormat = Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  });

  const [hasHadInitialUpdate, setHasHadInitialUpdate] = useState<boolean>(false);
  const calculatedCurrentAmount = useRef<number>(lastKnownAmount);

  const resourceUpdateFrequency = useMemo<number>(() => {
    return 3600000 / hourlyProduction;
  }, [hourlyProduction]);

  const formattedCurrentAmount = useMemo<string>(() => {
    return formatter.format(calculatedCurrentAmount.current);
  }, [calculatedCurrentAmount.current]);

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
    if (calculatedCurrentAmount.current >= storageCapacity) {
      return storageCapacity;
    }
    return calculatedCurrentAmount.current / storageCapacity;
  }, [calculatedCurrentAmount.current, storageCapacity]);

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
    if (calculatedCurrentAmount.current + increaseBy >= storageCapacity) {
      calculatedCurrentAmount.current = storageCapacity;
      return;
    }
    calculatedCurrentAmount.current += increaseBy;
  };

  // First resource update happens sooner or at 'resourceUpdateFrequency', the rest happen in an interval
  useEffect(() => {
    setHasHadInitialUpdate(false);
    const millisecondsSinceLastUpdate: number = Date.now() - updatedAt;
    const amountOfGeneratedResourcesSinceLastUpdate: number = Math.floor(millisecondsSinceLastUpdate / resourceUpdateFrequency);
    const millisecondsUntilNextUpdate: number = millisecondsSinceLastUpdate % resourceUpdateFrequency;
    increaseAmount(amountOfGeneratedResourcesSinceLastUpdate);

    const timeoutId = setTimeout(() => {
      increaseAmount();
      setHasHadInitialUpdate(true);
    }, millisecondsUntilNextUpdate);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [updatedAt]);

  useEffect(() => {
    if (!hasHadInitialUpdate) {
      return;
    }
    const intervalId = setInterval(() => {
      increaseAmount();
    }, resourceUpdateFrequency);

    return () => {
      clearInterval(intervalId);
    };
  }, [hasHadInitialUpdate]);

  return (
    <span>
      {formattedCurrentAmount}
    </span>
  );
};

export default StockContainer;
