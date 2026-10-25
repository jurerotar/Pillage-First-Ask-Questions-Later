import { use } from 'react';
import { useTranslation } from 'react-i18next';
import type { VillageStorageResourceDto } from '@pillage-first/types/dtos/village';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCalculatedResource } from 'app/(game)/(village-slug)/hooks/use-calculated-resource';
import { useVillageStorage } from 'app/(game)/(village-slug)/hooks/use-village-storage';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';

const granaryBuildingIds = new Set(['GRANARY', 'GREAT_GRANARY']);

const segmentColors = {
  stored: 'bg-emerald-500',
  gathering: 'bg-sky-500',
  marketplace: 'bg-amber-500',
  troops: 'bg-violet-500',
};

const StorageResource = ({
  resource,
  incoming,
  fullAt,
  emptyAt,
}: VillageStorageResourceDto) => {
  const { t } = useTranslation();
  const {
    calculatedResourceAmount: stored,
    hourlyProduction,
    storageCapacity: capacity,
    isFull,
    hasNegativeProduction,
  } = useCalculatedResource(resource);

  const segments = [
    { source: 'stored', label: t('Stored'), amount: stored },
    {
      source: 'gathering',
      label: t('Gathering expeditions'),
      amount: incoming.gathering,
    },
    {
      source: 'marketplace',
      label: t('Marketplace'),
      amount: incoming.marketplace,
    },
    { source: 'troops', label: t('Troop movements'), amount: incoming.troops },
  ] as const;

  const totalIncoming =
    incoming.gathering + incoming.marketplace + incoming.troops;

  const percentage = (amount: number) => {
    return capacity > 0 ? (amount / capacity) * 100 : 0;
  };

  const total = stored + totalIncoming;
  const boundary = hasNegativeProduction ? emptyAt : fullAt;

  let remainingWidth = 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-medium">
          <Icon
            type={resource}
            className="size-5"
          />
          <span>
            {t(`RESOURCES.${resource.toUpperCase()}`)} {formatNumber(stored)} /{' '}
            {formatNumber(capacity)}
          </span>
        </span>
        <span className="text-sm tabular-nums">
          {t('{{percent}}% filled', { percent: percentage(stored).toFixed(1) })}
          {totalIncoming > 0 && (
            <>
              {' '}
              ·{' '}
              {t('+{{percent}}% incoming', {
                percent: percentage(totalIncoming).toFixed(1),
              })}
            </>
          )}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t('Stored and incoming resources')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, percentage(total))}
        aria-valuetext={segments
          .map(({ label, amount }) => `${label}: ${formatNumber(amount)}`)
          .join(', ')}
        className="flex h-2 overflow-hidden rounded-full bg-muted"
      >
        {segments.map(({ source, label, amount }) => {
          const width = Math.min(
            remainingWidth,
            Math.max(0, percentage(amount)),
          );

          remainingWidth -= width;

          return (
            <div
              key={source}
              title={`${label}: ${formatNumber(amount)}`}
              className={segmentColors[source]}
              style={{ width: `${width}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {segments
          .filter(({ source, amount }) => source === 'stored' || amount > 0)
          .map(({ source, label, amount }) => (
            <span
              key={source}
              className="flex items-center gap-1.5"
            >
              <span
                className={`size-2.5 rounded-full ${segmentColors[source]}`}
              />
              {label}: {formatNumber(amount)}
            </span>
          ))}
      </div>
      {total > capacity && totalIncoming > 0 && (
        <Text className="text-sm text-amber-600 dark:text-amber-400">
          {t('{{amount}} resources exceed current free capacity', {
            amount: formatNumber(total - capacity),
          })}
        </Text>
      )}
      <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {t('{{amount}} / hour', { amount: formatNumber(hourlyProduction) })}
        </span>
        <span>
          {hasNegativeProduction && stored <= 0 ? (
            t('Empty')
          ) : !hasNegativeProduction && isFull ? (
            t('Full')
          ) : boundary === null ? (
            t('Storage will not fill at current production')
          ) : (
            <>
              {hasNegativeProduction ? t('Empty in') : t('Full in')}{' '}
              <Countdown endsAt={boundary} />
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export const Storage = () => {
  const { t } = useTranslation();
  const { buildingField } = use(BuildingFieldContext);
  const { storage } = useVillageStorage();

  const isGranary = granaryBuildingIds.has(buildingField!.buildingId);

  const resources = storage.resources.filter(({ resource }) => {
    return isGranary ? resource === 'wheat' : resource !== 'wheat';
  });

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="storage" />
        <InformationPopover ariaLabel={t('Storage')}>
          <Text>
            {t(
              'Village storage and resources currently on the way. Timers include incoming deliveries and assume current production remains unchanged.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Storage')}</Text>
      </SectionContent>
      {resources.map((resource) => (
        <StorageResource
          key={resource.resource}
          {...resource}
        />
      ))}
    </Section>
  );
};
