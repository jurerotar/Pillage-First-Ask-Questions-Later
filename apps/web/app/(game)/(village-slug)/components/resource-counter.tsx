import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    <div className="flex w-full flex-col gap-1">
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
      <div className="relative flex h-4 lg:h-5 w-full rounded-xs bg-[linear-gradient(#7b746e,#dad8d5,#ebebeb)] shadow-inner border border-[#b8b2a9] overflow-hidden">
        <div
          className={clsx(
            isFull || hasNegativeProduction
              ? 'bg-[linear-gradient(#ff9696,#ff9696_40%,#a60000)] border-[#a60000]'
              : 'bg-[linear-gradient(#c7e94f,#c7e94f_40%,#506d00)] border-[#506d00]',
            calculatedResourceAmount !== 0 && 'border',
            'flex w-full h-full rounded-xs origin-left transition-transform',
          )}
          style={{
            transform: `scaleX(${storagePercentage / 100})`,
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center gap-1 whitespace-nowrap text-[10px] lg:text-xs leading-none font-medium tabular-nums text-black [text-shadow:0_0_2px_white,0_0_2px_white]">
          {storageLimitAt !== null ? (
            <Countdown endsAt={storageLimitAt} />
          ) : (
            <>
              <span className="sr-only">
                {isFull ? t('Full') : t('No production')}
              </span>
              <span aria-hidden>—</span>
            </>
          )}
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
