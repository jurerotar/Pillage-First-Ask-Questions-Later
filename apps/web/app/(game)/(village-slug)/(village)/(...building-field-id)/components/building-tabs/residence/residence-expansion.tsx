import { useTranslation } from 'react-i18next';
import { calculateCulturePointsRequirementForVillageCount } from '@pillage-first/game-assets/utils/culture-points';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';
import { useCulturePoints } from 'app/(game)/(village-slug)/hooks/use-culture-points';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Progress } from 'app/components/ui/progress';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const ResidenceExpansion = () => {
  const { t } = useTranslation();
  const { culturePoints, culturePointsUpdatedAt } = useCulturePoints();
  const { server } = useServer();
  const now = useCountdown();
  const { playerCulturePointsProduction: dailyProduction } = culturePoints;

  const availableCulturePoints =
    culturePoints.culturePoints +
    (Math.max(0, now - culturePointsUpdatedAt) * dailyProduction) /
      DAY_IN_MILLISECONDS;
  let availableVillageCount = 1;

  while (
    calculateCulturePointsRequirementForVillageCount(
      availableVillageCount + 1,
      server.configuration.culturePointsRequirementSpeed,
    ) <= availableCulturePoints
  ) {
    availableVillageCount += 1;
  }

  const previousRequirement = calculateCulturePointsRequirementForVillageCount(
    availableVillageCount,
    server.configuration.culturePointsRequirementSpeed,
  );
  const nextRequirement = calculateCulturePointsRequirementForVillageCount(
    availableVillageCount + 1,
    server.configuration.culturePointsRequirementSpeed,
  );
  const progress =
    nextRequirement > previousRequirement
      ? Math.min(
          100,
          Math.max(
            0,
            ((availableCulturePoints - previousRequirement) /
              (nextRequirement - previousRequirement)) *
              100,
          ),
        )
      : 100;

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
