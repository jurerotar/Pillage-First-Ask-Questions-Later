import { clsx } from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GiCastle, GiVillage } from 'react-icons/gi';
import type { z } from 'zod';
import type {
  kingdomStatisticsComparisonItemDtoSchema,
  villageStatisticsComparisonItemDtoSchema,
} from '@pillage-first/types/dtos/statistics';
import { formatNumberWithCommas } from '@pillage-first/utils/format';
import { useProductionAndPowerStatistics } from 'app/(game)/(village-slug)/(statistics)/components/hooks/use-production-and-power-statistics';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import type { IconType } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

type KingdomStatisticsComparisonItem = z.infer<
  typeof kingdomStatisticsComparisonItemDtoSchema
>;
type VillageStatisticsComparisonItem = z.infer<
  typeof villageStatisticsComparisonItemDtoSchema
>;
type StatisticsComparisonItem =
  | KingdomStatisticsComparisonItem
  | VillageStatisticsComparisonItem;

type Scope = 'village' | 'kingdom';

type StatisticsMetric = {
  icon: IconType;
  label: string;
  amount: number;
  average: number;
  rank: number;
};

type RankDonutProps = {
  rank: number;
  total: number;
};

const formatValue = (value: number): string =>
  formatNumberWithCommas(Math.trunc(value));

const getRankProgress = (rank: number, total: number): number => {
  if (total <= 1) {
    return 360;
  }

  return Math.max(0, Math.min(360, ((total - rank + 1) / total) * 360));
};

const RankDonut = ({ rank, total }: RankDonutProps) => {
  const { t } = useTranslation();
  const progress = getRankProgress(rank, total) / 360;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      aria-label={t('Rank {{rank}} of {{total}}', { rank, total })}
      className="relative grid size-[68px] shrink-0 place-items-center"
      role="img"
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0"
        height="68"
        viewBox="0 0 68 68"
        width="68"
      >
        <circle
          cx="34"
          cy="34"
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeWidth="9"
          className="text-border"
        />
        <circle
          cx="34"
          cy="34"
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth="9"
          className="text-success"
          transform="rotate(-90 34 34)"
        />
      </svg>
      <Text
        as="span"
        className="relative text-lg font-semibold text-success"
      >
        #{rank}
      </Text>
    </div>
  );
};

const StatisticsMetricRow = ({
  amount,
  average,
  icon,
  label,
  rank,
  total,
}: StatisticsMetric & { total: number }) => {
  const { t } = useTranslation();

  return (
    <li className="grid grid-cols-[4.5rem_1fr] gap-4 border-border border-b px-4 py-5 last:border-b-0 sm:grid-cols-[5.5rem_1fr] sm:px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="grid size-12 place-items-center rounded-sm border border-border bg-background shadow-xs">
          <Icon
            className="size-8"
            type={icon}
          />
        </div>
        <RankDonut
          rank={rank}
          total={total}
        />
      </div>
      <div className="min-w-0 pt-1">
        <Text
          as="h4"
          className="font-semibold text-muted-foreground text-sm uppercase tracking-normal"
        >
          {label}
        </Text>
        <Text className="mt-1 text-3xl font-semibold text-success leading-tight">
          {formatValue(amount)}
        </Text>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Text
            as="span"
            className="text-lg"
            variant="muted"
          >
            {t('of {{total}}', { total })}
          </Text>
          <Text
            as="span"
            className="text-lg"
            variant="muted"
          >
            {t('avg {{amount}}', { amount: formatValue(average) })}
          </Text>
        </div>
      </div>
    </li>
  );
};

const StatisticsMetricList = ({
  footer,
  rows,
  total,
}: {
  footer: string;
  rows: StatisticsMetric[];
  total: number;
}) => (
  <>
    <ul className="divide-border">
      {rows.map((row) => (
        <StatisticsMetricRow
          key={row.label}
          {...row}
          total={total}
        />
      ))}
    </ul>
    <Text
      className="px-4 pb-5 text-center text-sm sm:px-6"
      variant="muted"
    >
      {footer}
    </Text>
  </>
);

const getStatisticsMetrics = (
  item: StatisticsComparisonItem,
  t: ReturnType<typeof useTranslation>['t'],
): StatisticsMetric[] => [
  {
    icon: 'wheatProduction',
    label: t('Total production'),
    amount: item.production.total,
    average: item.productionAverage,
    rank: item.productionRank,
  },
  {
    icon: 'attack',
    label: t('Attack'),
    amount: item.attackPower,
    average: item.attackPowerAverage,
    rank: item.attackPowerRank,
  },
  {
    icon: 'infantryDefence',
    label: t('Infantry defence'),
    amount: item.infantryDefencePower,
    average: item.infantryDefencePowerAverage,
    rank: item.infantryDefencePowerRank,
  },
  {
    icon: 'cavalryDefence',
    label: t('Cavalry defence'),
    amount: item.cavalryDefencePower,
    average: item.cavalryDefencePowerAverage,
    rank: item.cavalryDefencePowerRank,
  },
  {
    icon: 'defence',
    label: t('Total defence'),
    amount: item.totalDefencePower,
    average: item.totalDefencePowerAverage,
    rank: item.totalDefencePowerRank,
  },
];

export const ProductionAndPowerComparison = () => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<Scope>('village');
  const { currentVillage } = useCurrentVillage();
  const { productionAndPowerStatistics } = useProductionAndPowerStatistics(
    currentVillage.id,
  );
  const { kingdom, kingdomCount, village, villageCount } =
    productionAndPowerStatistics;

  return (
    <Section>
      <InformationPopover ariaLabel={t('Production and power')}>
        <Text>
          {t(
            'Shows your resource production, attack power, defence power, game world averages and rankings for the selected scope.',
          )}
        </Text>
      </InformationPopover>
      <Text as="h2">{t('Production and power')}</Text>
      <Tabs
        value={scope}
        onValueChange={(value) => {
          setScope(value as Scope);
        }}
      >
        <div className="overflow-hidden rounded-sm border border-border bg-background/60">
          <div className="flex flex-col gap-3 border-border border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Text
              as="h3"
              className="font-semibold text-muted-foreground uppercase tracking-normal"
            >
              {t('Your performance')}
            </Text>
            <TabList className="w-full shrink-0 sm:w-auto">
              <Tab
                className={clsx(
                  'flex-1 gap-2 sm:flex-none',
                  scope === 'village' && 'text-success',
                )}
                value="village"
              >
                <GiVillage className="size-4" />
                {t('Village')}
              </Tab>
              <Tab
                className={clsx(
                  'flex-1 gap-2 sm:flex-none',
                  scope === 'kingdom' && 'text-success',
                )}
                value="kingdom"
              >
                <GiCastle className="size-4" />
                {t('Kingdom')}
              </Tab>
            </TabList>
          </div>
          <TabPanel
            className="mt-0 border-0 p-0"
            value="village"
          >
            <StatisticsMetricList
              footer={t('Ranked among all villages.')}
              rows={getStatisticsMetrics(village, t)}
              total={villageCount}
            />
          </TabPanel>
          <TabPanel
            className="mt-0 border-0 p-0"
            value="kingdom"
          >
            <StatisticsMetricList
              footer={t('Ranked among all kingdoms.')}
              rows={getStatisticsMetrics(kingdom, t)}
              total={kingdomCount}
            />
          </TabPanel>
        </div>
      </Tabs>
    </Section>
  );
};
