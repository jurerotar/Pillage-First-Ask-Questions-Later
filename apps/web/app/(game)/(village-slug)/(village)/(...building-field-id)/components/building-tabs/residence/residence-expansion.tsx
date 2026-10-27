import { useTranslation } from 'react-i18next';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCulturePointsProgress } from 'app/(game)/(village-slug)/hooks/use-culture-points-progress';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Progress } from 'app/components/ui/progress';

export const ResidenceExpansion = () => {
  const { t } = useTranslation();
  const {
    culturePoints,
    dailyProduction,
    availableCulturePoints,
    availableVillageCount,
    previousRequirement,
    nextRequirement,
    progress,
  } = useCulturePointsProgress();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="expansion" />
        <InformationPopover ariaLabel={t('Expansion')}>
          <Text>
            {t(
              "Expansion tracks this village's settlers, administrators, and available expansion slots for founding or conquering additional villages.",
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Expansion')}</Text>
      </SectionContent>
      <SectionContent>
        <Text as="h3">{t('Culture points')}</Text>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center gap-2">
            <Text className="text-xs font-medium text-muted-foreground uppercase">
              {t('Progress to next village')}
            </Text>
            <Text className="text-right font-medium text-sm tabular-nums">
              {Math.floor(progress)}%
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Text
              as="span"
              className="shrink-0 text-sm font-medium tabular-nums"
            >
              {formatNumber(previousRequirement)}
            </Text>
            <Progress
              value={progress}
              aria-label={t('Culture points progress')}
              className="border border-[#0d648e] [&>div]:bg-[linear-gradient(#b1e4ff,#24b4fd_60%,#1271a2)] h-2.5"
            />
            <Text
              as="span"
              className="shrink-0 text-sm font-medium tabular-nums"
            >
              {formatNumber(nextRequirement)}
            </Text>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground uppercase">
              {t('Villages')}
            </dt>
            <dd className="font-medium tabular-nums">
              {formatNumber(culturePoints.villageCount)} /{' '}
              {formatNumber(availableVillageCount)}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground uppercase">
              {t('Current culture points')}
            </dt>
            <dd className="font-medium tabular-nums">
              {formatNumber(Math.floor(availableCulturePoints))}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground uppercase">
              {t('Remaining to unlock')}
            </dt>
            <dd className="font-medium tabular-nums">
              {formatNumber(
                Math.max(
                  0,
                  Math.ceil(nextRequirement - availableCulturePoints),
                ),
              )}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground uppercase">
              {t('Village production')}
            </dt>
            <dd className="font-medium tabular-nums">
              {t('{{amount}} per day', {
                amount: formatNumber(
                  culturePoints.currentVillageCulturePointsProduction,
                ),
              })}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground uppercase">
              {t('Global production')}
            </dt>
            <dd className="font-medium tabular-nums">
              {t('{{amount}} per day', {
                amount: formatNumber(dailyProduction),
              })}
            </dd>
          </div>
        </dl>
      </SectionContent>
    </Section>
  );
};
