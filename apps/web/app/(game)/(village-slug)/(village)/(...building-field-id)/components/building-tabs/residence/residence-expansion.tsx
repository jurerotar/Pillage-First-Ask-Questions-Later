import { useTranslation } from 'react-i18next';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCulturePointsProgress } from 'app/(game)/(village-slug)/hooks/use-culture-points-progress';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Progress } from 'app/components/ui/progress';

export const ResidenceExpansion = () => {
  const { t } = useTranslation();
  const {
    culturePoints,
    dailyProduction,
    availableCulturePoints,
    availableVillageCount,
    nextRequirement,
    nextRequirementAt,
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
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-medium">
              <Icon
                type="culturePoints"
                className="size-5"
              />
              <span>
                {t('Culture points')}{' '}
                {formatNumber(Math.floor(availableCulturePoints))} /{' '}
                {formatNumber(nextRequirement)}
              </span>
            </span>
            <span className="text-sm tabular-nums">
              {t('{{percent}}% filled', { percent: progress.toFixed(1) })}
            </span>
          </div>
          <div className="relative">
            <Progress
              value={progress}
              aria-label={t('Culture points progress')}
              aria-valuetext={`${formatNumber(Math.floor(availableCulturePoints))} / ${formatNumber(nextRequirement)}`}
              className="box-content h-2.5 rounded-xs border border-[#b8b2a9] bg-[linear-gradient(#7b746e,#dad8d5,#ebebeb)] shadow-inner [&>div]:bg-[linear-gradient(#b1e4ff,#24b4fd_60%,#1271a2)]"
            />
            {nextRequirementAt !== null && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center whitespace-nowrap text-[8px] lg:text-xs leading-none font-medium tabular-nums text-black">
                <Countdown
                  endsAt={nextRequirementAt}
                  aria-label={t('Time remaining')}
                />
              </span>
            )}
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
