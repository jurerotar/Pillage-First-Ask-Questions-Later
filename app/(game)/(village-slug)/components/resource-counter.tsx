import type { Resource } from 'app/interfaces/models/game/resource';
import { use } from 'react';
import { useCalculatedResource } from 'app/(game)/(village-slug)/hooks/use-calculated-resource';
import { formatNumberWithCommas, truncateToShortForm } from 'app/utils/common';
import { Icon } from 'app/components/icon';
import clsx from 'clsx';
import { Link } from 'react-router';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';

type ResourceCounterProps = {
  resource: Resource;
};

export const ResourceCounter = ({ resource }: ResourceCounterProps) => {
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const { computedWarehouseCapacityEffect, computedGranaryCapacityEffect } =
    use(CurrentVillageStateContext);
  const storage =
    resource === 'wheat'
      ? computedGranaryCapacityEffect.total
      : computedWarehouseCapacityEffect.total;

  const {
    calculatedResourceAmount,
    hourlyProduction,
    storageCapacity,
    isFull,
    hasNegativeProduction,
  } = useCalculatedResource(resource, storage);

  const storagePercentage = (calculatedResourceAmount / storageCapacity) * 100;

  const formattedCurrentAmount = formatNumberWithCommas(
    calculatedResourceAmount,
  );

  const formattedStorageCapacity = truncateToShortForm(storageCapacity);
  const formattedHourlyProduction = isWiderThanLg
    ? formatNumberWithCommas(hourlyProduction)
    : truncateToShortForm(hourlyProduction);

  return (
    <Link
      to={{ pathname: 'production-overview', search: `?tab=${resource}` }}
      className="flex w-full flex-col gap-1"
    >
      <div className="flex w-full items-center justify-between">
        <Icon
          className="size-4 lg:size-6"
          type={resource}
        />
        <span className="inline-flex items-center">
          <span className="text-xs lg:text-md font-medium leading-none">
            {formattedCurrentAmount}
          </span>
          <span className="hidden lg:inline-flex text-xs text-gray-400 font-normal leading-none">
            /{formattedStorageCapacity}
          </span>
        </span>
      </div>
      <div className="relative flex h-2 lg:h-2.5 w-full rounded-xs bg-[linear-gradient(#7b746e,#dad8d5,#ebebeb)] shadow-inner border border-[#b8b2a9] overflow-hidden">
        <div
          className={clsx(
            isFull || hasNegativeProduction
              ? 'bg-red-500 border-red-700'
              : 'bg-green-400 border-green-600',
            calculatedResourceAmount !== 0 && 'border lg:border-2',
            'flex w-full h-full rounded-xs origin-left transition-transform',
          )}
          style={{
            transform: `scaleX(${storagePercentage / 100})`,
          }}
        />
      </div>
      <div className="flex justify-between lg:justify-end items-center">
        <span className="inline-flex lg:hidden text-2xs md:text-xs">
          {formattedStorageCapacity}
        </span>
        <span className="inline-flex text-2xs md:text-xs">
          {formattedHourlyProduction}/h
        </span>
      </div>
    </Link>
  );
};
