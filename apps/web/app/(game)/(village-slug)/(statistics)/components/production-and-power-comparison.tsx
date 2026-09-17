import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import type {
  kingdomStatisticsComparisonItemDtoSchema,
  villageStatisticsComparisonItemDtoSchema,
} from '@pillage-first/types/dtos/statistics';
import { formatNumberWithCommas } from '@pillage-first/utils/format';
import { useProductionAndPowerStatistics } from 'app/(game)/(village-slug)/(statistics)/components/hooks/use-production-and-power-statistics';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';

type KingdomStatisticsComparisonItem = z.infer<
  typeof kingdomStatisticsComparisonItemDtoSchema
>;
type VillageStatisticsComparisonItem = z.infer<
  typeof villageStatisticsComparisonItemDtoSchema
>;
type StatisticsComparisonItem =
  | KingdomStatisticsComparisonItem
  | VillageStatisticsComparisonItem;

const formatValue = (value: number): string =>
  formatNumberWithCommas(Math.trunc(value));

type StatisticsRow = {
  label: string;
  amount: number;
  rank: number;
};

type RankDonutProps = {
  rank: number;
  total: number;
};

const getRankProgress = (rank: number, total: number): number => {
  if (total <= 1) {
    return 360;
  }

  return Math.max(0, Math.min(360, ((total - rank + 1) / total) * 360));
};

const RankDonut = ({ rank, total }: RankDonutProps) => {
  const { t } = useTranslation();
  const progress = getRankProgress(rank, total) / 360;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-3">
      <div
        aria-label={t('Rank {{rank}} of {{total}}', { rank, total })}
        className="relative grid shrink-0 place-items-center"
        role="img"
        style={{ height: 80, width: 80 }}
      >
        <svg
          aria-hidden="true"
          className="absolute inset-0"
          height="80"
          viewBox="0 0 80 80"
          width="80"
        >
          <circle
            cx="40"
            cy="40"
            fill="none"
            r={radius}
            stroke="#d8d5ca"
            strokeWidth="10"
          />
          <circle
            cx="40"
            cy="40"
            fill="none"
            r={radius}
            stroke="#78923a"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeWidth="10"
            transform="rotate(-90 40 40)"
          />
        </svg>
        <Text
          as="span"
          className="relative text-xl font-semibold text-success"
        >
          #{rank}
        </Text>
      </div>
      <div>
        <Text
          as="span"
          className="text-sm"
          variant="muted"
        >
          {t('of {{total}}', { total })}
        </Text>
      </div>
    </div>
  );
};

const StatisticsCard = ({
  amount,
  label,
  rank,
  total,
}: StatisticsRow & { total: number }) => (
  <div className="flex min-h-32 items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
    <div className="min-w-0">
      <Text
        as="h4"
        className="font-semibold text-muted-foreground uppercase"
      >
        {label}
      </Text>
      <Text className="mt-1 text-2xl font-semibold text-success">
        {formatValue(amount)}
      </Text>
    </div>
    <RankDonut
      rank={rank}
      total={total}
    />
  </div>
);

const StatisticsGrid = ({
  rows,
  total,
}: {
  rows: StatisticsRow[];
  total: number;
}) => (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {rows.map((row) => (
      <StatisticsCard
        key={row.label}
        {...row}
        total={total}
      />
    ))}
  </div>
);

const getResourceRows = (
  item: StatisticsComparisonItem,
  t: ReturnType<typeof useTranslation>['t'],
): StatisticsRow[] => [
  {
    label: t('Wood'),
    amount: item.production.wood,
    rank: item.woodProductionRank,
  },
  {
    label: t('Clay'),
    amount: item.production.clay,
    rank: item.clayProductionRank,
  },
  {
    label: t('Iron'),
    amount: item.production.iron,
    rank: item.ironProductionRank,
  },
  {
    label: t('Wheat'),
    amount: item.production.wheat,
    rank: item.wheatProductionRank,
  },
  {
    label: t('Total production'),
    amount: item.production.total,
    rank: item.productionRank,
  },
];

const getPowerRows = (
  item: StatisticsComparisonItem,
  t: ReturnType<typeof useTranslation>['t'],
): StatisticsRow[] => [
  {
    label: t('Attack'),
    amount: item.attackPower,
    rank: item.attackPowerRank,
  },
  {
    label: t('Infantry defence'),
    amount: item.infantryDefencePower,
    rank: item.infantryDefencePowerRank,
  },
  {
    label: t('Cavalry defence'),
    amount: item.cavalryDefencePower,
    rank: item.cavalryDefencePowerRank,
  },
  {
    label: t('Total defence'),
    amount: item.totalDefencePower,
    rank: item.totalDefencePowerRank,
  },
];

export const ProductionAndPowerComparison = () => {
  const { t } = useTranslation();
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
            'Shows your total resource production, attack power, defence power and their game world rankings.',
          )}
        </Text>
      </InformationPopover>
      <Text as="h2">{t('Production and power')}</Text>
      <SectionContent>
        <Text as="h3">{t('Kingdom resource production')}</Text>
        <StatisticsGrid
          rows={getResourceRows(kingdom, t)}
          total={kingdomCount}
        />
      </SectionContent>
      <SectionContent>
        <Text as="h3">{t('Kingdom combat power')}</Text>
        <StatisticsGrid
          rows={getPowerRows(kingdom, t)}
          total={kingdomCount}
        />
      </SectionContent>
      <SectionContent>
        <Text as="h3">{t('Village resource production')}</Text>
        <StatisticsGrid
          rows={getResourceRows(village, t)}
          total={villageCount}
        />
      </SectionContent>
      <SectionContent>
        <Text as="h3">{t('Village combat power')}</Text>
        <StatisticsGrid
          rows={getPowerRows(village, t)}
          total={villageCount}
        />
      </SectionContent>
    </Section>
  );
};
