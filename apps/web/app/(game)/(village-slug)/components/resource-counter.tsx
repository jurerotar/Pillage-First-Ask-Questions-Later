import { clsx } from 'clsx';
import type { Resource } from '@pillage-first/types/models/resource';
import {
  formatNumberWithCommas,
  truncateToShortForm,
} from '@pillage-first/utils/format';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useCalculatedResource } from 'app/(game)/(village-slug)/hooks/use-calculated-resource';
import { Icon } from 'app/components/icon';

type ResourceCounterProps = {
  resource: Resource;
  showDetails?: boolean;
};

export const ResourceCounter = ({
  resource,
  showDetails = true,
}: ResourceCounterProps) => {
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const {
    calculatedResourceAmount,
    hourlyProduction,
    storageCapacity,
    isFull,
    hasNegativeProduction,
    storageLimitAt,
  } = useCalculatedResource(resource);

  const storagePercentage = (calculatedResourceAmount / storageCapacity) * 100;

  const formattedCurrentAmount = formatNumberWithCommas(
    calculatedResourceAmount,
  );

  const formattedStorageCapacity = truncateToShortForm(storageCapacity);
  const formattedHourlyProduction = isWiderThanLg
    ? formatNumberWithCommas(hourlyProduction)
    : truncateToShortForm(hourlyProduction);

  return (
    <div className="flex w-full flex-col gap-0.5">
      <div className="flex w-full items-center justify-between">
        <Icon
          className="size-4 lg:size-6"
          type={resource}
        />
        <span className="inline-flex items-center">
          <span className="text-xs lg:text-md font-medium leading-none">
            {formattedCurrentAmount}
          </span>
          <span className="hidden lg:inline-flex text-xs text-muted-foreground font-normal leading-none transition-colors">
            /{formattedStorageCapacity}
          </span>
        </span>
      </div>
      <div className="relative flex box-content h-2.5 w-full rounded-xs bg-[linear-gradient(#7b746e,#dad8d5,#ebebeb)] shadow-inner border border-[#b8b2a9] overflow-hidden">
        <div
          className={clsx(
            isFull || hasNegativeProduction
              ? 'bg-resource-bar-red border-resource-bar-red-border'
              : 'bg-resource-bar-green border-resource-bar-green-border',
            calculatedResourceAmount !== 0 && 'border',
            'h-full shrink-0 rounded-[max(0px,calc(var(--radius-xs)-1px))] transition-[width]',
          )}
          style={{
            width: `${Math.min(100, Math.max(0, storagePercentage))}%`,
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center gap-1 whitespace-nowrap text-[8px] lg:text-xs leading-none font-medium tabular-nums text-black">
          {storageLimitAt !== null && <Countdown endsAt={storageLimitAt} />}
        </span>
      </div>
      <div
        aria-hidden={!showDetails}
        className={clsx(
          showDetails
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0',
          'grid transition-all duration-300 ease-out lg:grid-rows-[1fr] lg:opacity-100',
        )}
      >
        <div className="overflow-hidden">
          <div className="flex justify-between lg:justify-end items-center">
            <span className="inline-flex lg:hidden text-2xs md:text-xs">
              {formattedStorageCapacity}
            </span>
            <span className="inline-flex text-2xs md:text-xs">
              {formattedHourlyProduction}/h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
