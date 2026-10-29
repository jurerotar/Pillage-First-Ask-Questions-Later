import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  CULTURE_POINTS_CELEBRATION_COSTS,
  CULTURE_POINTS_CELEBRATION_LIMITS,
  type CulturePointsCelebrationType,
  calculateCulturePointsCelebrationDuration,
} from '@pillage-first/game-assets/utils/culture-points';
import { formatNumber } from '@pillage-first/utils/format';
import { useCelebrationErrorBag } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/town-hall/hooks/use-celebration-error-bag';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useCulturePoints } from 'app/(game)/(village-slug)/hooks/use-culture-points';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { CurrentVillageLiveResourcesSnapshotContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';
import { InformationPopover } from 'app/(game)/components/information-popover';
import {
  culturePointsCacheKey,
  currentVillageCacheKey,
  playersCacheKey,
} from 'app/(game)/constants/query-keys';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { formatTime } from 'app/utils/time';

type CelebrationCardProps = {
  celebrationType: CulturePointsCelebrationType;
  townHallLevel: number;
};

export const CelebrationCard = ({
  celebrationType,
  townHallLevel,
}: CelebrationCardProps) => {
  const { t } = useTranslation();
  const { serverSpeed } = useServer();
  const { currentVillage } = useCurrentVillage();
  const { culturePoints } = useCulturePoints();
  const { developerSettings } = useDeveloperSettings();
  const { createEvent } = useCreateEvent('culturePointsCelebration');
  const liveResources = use(CurrentVillageLiveResourcesSnapshotContext);

  const { isFreeCelebrationsEnabled, isInstantCelebrationsEnabled } =
    developerSettings;

  const cost = isFreeCelebrationsEnabled
    ? [0, 0, 0, 0]
    : CULTURE_POINTS_CELEBRATION_COSTS[celebrationType];

  const limit = CULTURE_POINTS_CELEBRATION_LIMITS[celebrationType];

  const reward = Math.min(
    celebrationType === 'small'
      ? culturePoints.currentVillageCulturePointsProduction
      : culturePoints.playerCulturePointsProduction,
    limit,
  );

  const duration = isInstantCelebrationsEnabled
    ? 0
    : calculateCulturePointsCelebrationDuration({
        celebrationType,
        townHallLevel,
        serverSpeed,
      });

  const { errorBag, isDisabled } = useCelebrationErrorBag({
    celebrationType,
    townHallLevel,
    cost,
  });

  const celebrationName =
    celebrationType === 'small'
      ? t('Small Celebration')
      : t('Large Celebration');

  return (
    <article className="flex flex-col gap-2 relative">
      <InformationPopover ariaLabel={celebrationName}>
        <Text>
          {celebrationType === 'small'
            ? t(
                'A small celebration instantly grants culture points equal to this village?s daily production, up to the celebration limit.',
              )
            : t(
                'A large celebration instantly grants culture points equal to the daily production of all your villages, up to the celebration limit.',
              )}
        </Text>
        {celebrationType === 'large' && (
          <Text>
            {t(
              'During a large celebration, your administrators reduce enemy village loyalty by up to 5% more, and your own villages lose up to 5% less loyalty when attacked. These effects apply to all battles during the celebration, regardless of when troops were sent.',
            )}
          </Text>
        )}
      </InformationPopover>
      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-1 md:max-w-4/5">
          <Text
            as="h2"
            className="inline-flex"
          >
            {celebrationName}
          </Text>
        </div>
      </section>
      <section className="flex flex-col flex-wrap gap-2 justify-center">
        <Text as="h3">{t('Cost and duration')}</Text>
        <div className="flex gap-2 items-center flex-wrap">
          <Resources
            resources={cost}
            availableResources={liveResources}
          />
          <span className="flex gap-1 items-center">
            <Icon
              type="buildingDuration"
              className="size-5"
            />
            {formatTime(duration)}
          </span>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <Text as="h3">{t('Reward')}</Text>
        <Text className="flex gap-1 items-center">
          <Icon
            type="culturePoints"
            className="size-5"
          />
          {t('{{amount}} culture points', { amount: formatNumber(reward) })}
        </Text>
      </section>
      <section className="flex flex-col gap-2">
        <Button
          size="fit"
          disabled={isDisabled}
          onClick={() => {
            createEvent(
              {
                celebrationType,
                cachesToClearImmediately: [
                  [culturePointsCacheKey],
                  [currentVillageCacheKey, currentVillage.slug],
                  [playersCacheKey],
                ],
              },
              {
                onSuccess: () => {
                  toast.success(t('Celebration started'));
                },
              },
            );
          }}
        >
          {t('Start celebration')}
        </Button>
        <ErrorBag errorBag={errorBag} />
      </section>
    </article>
  );
};
