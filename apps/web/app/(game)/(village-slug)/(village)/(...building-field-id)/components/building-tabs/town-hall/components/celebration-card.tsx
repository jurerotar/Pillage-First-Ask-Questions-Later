import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  CULTURE_POINTS_CELEBRATION_COSTS,
  calculateCulturePointsCelebrationDuration,
  calculateCulturePointsCelebrationReward,
} from '@pillage-first/game-assets/utils/culture-points';
import type { CulturePointsCelebrationType } from '@pillage-first/types/models/celebration';
import { formatNumber } from '@pillage-first/utils/format';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useResourceAvailability } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import { useActiveCelebration } from 'app/(game)/(village-slug)/hooks/use-active-celebration';
import { useCulturePoints } from 'app/(game)/(village-slug)/hooks/use-culture-points';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { CurrentVillageLiveResourcesSnapshotContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';
import { InformationPopover } from 'app/(game)/components/information-popover';
import {
  collectableQuestCountCacheKey,
  culturePointsCacheKey,
  currentVillageCacheKey,
  playersCacheKey,
  questsCacheKey,
  villageCelebrationCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { invalidateQueries } from 'app/utils/react-query';
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
  const { apiClient } = use(ApiContext);
  const liveResources = use(CurrentVillageLiveResourcesSnapshotContext);

  const { mutate: startCelebration, isPending } = useMutation({
    mutationFn: () => {
      return apiClient.post('/villages/:villageId/celebration', {
        path: { villageId: currentVillage.id },
        body: { celebrationType },
      });
    },
    onSuccess: async (_, _args, _result, context) => {
      await invalidateQueries(context, [
        [villageCelebrationCacheKey, currentVillage.id],
        [culturePointsCacheKey],
        [currentVillageCacheKey, currentVillage.slug],
        [playersCacheKey],
        [questsCacheKey],
        [collectableQuestCountCacheKey],
      ]);

      toast.success(t('Celebration started'));
    },
  });

  const { isFreeCelebrationsEnabled, isInstantCelebrationsEnabled } =
    developerSettings;

  const cost = isFreeCelebrationsEnabled
    ? [0, 0, 0, 0]
    : CULTURE_POINTS_CELEBRATION_COSTS[celebrationType];

  const reward = calculateCulturePointsCelebrationReward(
    celebrationType,
    celebrationType === 'small'
      ? culturePoints.currentVillageCulturePointsProduction
      : culturePoints.playerCulturePointsProduction,
  );

  const duration = isInstantCelebrationsEnabled
    ? 0
    : calculateCulturePointsCelebrationDuration({
        celebrationType,
        townHallLevel,
        serverSpeed,
      });

  const { hasEnoughResources, errorBag } = useResourceAvailability(cost);
  const activeCelebration = useActiveCelebration();
  const isLargeCelebrationLocked =
    celebrationType === 'large' && townHallLevel < 10;

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
          disabled={
            isPending ||
            !!activeCelebration ||
            isLargeCelebrationLocked ||
            !hasEnoughResources
          }
          onClick={() => startCelebration()}
        >
          {t('Start celebration')}
        </Button>
        <ErrorBag
          errorBag={[
            isLargeCelebrationLocked &&
              t('Large celebrations require Town Hall level 10.'),
            ...errorBag,
            activeCelebration && (
              <span key="celebration-cooldown">
                {t('Another celebration can start in')}{' '}
                <Countdown endsAt={activeCelebration.endsAt} />
              </span>
            ),
          ]}
        />
      </section>
    </article>
  );
};
