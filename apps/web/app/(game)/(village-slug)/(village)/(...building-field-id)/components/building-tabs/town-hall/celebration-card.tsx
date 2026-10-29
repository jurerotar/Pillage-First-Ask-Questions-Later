import { use } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CULTURE_POINTS_CELEBRATION_COSTS,
  CULTURE_POINTS_CELEBRATION_LIMITS,
  type CulturePointsCelebrationType,
  calculateCulturePointsCelebrationDuration,
} from '@pillage-first/game-assets/utils/culture-points';
import { formatNumber } from '@pillage-first/utils/format';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useResourceAvailability } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useCulturePoints } from 'app/(game)/(village-slug)/hooks/use-culture-points';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
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
  const { eventsByType: celebrationEvents } = useEventsByType(
    'culturePointsCelebration',
  );
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

  const { hasEnoughResources, errorBag } = useResourceAvailability(cost);

  const activeCelebration = celebrationEvents[0];

  const isLargeCelebrationLocked =
    celebrationType === 'large' && townHallLevel < 10;

  const isDisabled =
    !!activeCelebration || isLargeCelebrationLocked || !hasEnoughResources;

  const celebrationName =
    celebrationType === 'small'
      ? t('Small Celebration')
      : t('Large Celebration');

  return (
    <article className="flex flex-col gap-2 relative">
      <InformationPopover ariaLabel={celebrationName}>
        <ul className="list-disc pl-4">
          <li>
            <Text>{t('Gives Culture Points immediately.')}</Text>
          </li>
          <li>
            <Text>
              {celebrationType === 'small'
                ? t(
                    'Culture Points gained equals the daily Culture Points production of the village, up to the celebration limit.',
                  )
                : t(
                    'Culture Points gained equals the daily Culture Points production of all your villages, up to the limit.',
                  )}
            </Text>
          </li>
          {celebrationType === 'large' && (
            <>
              <li>
                <Text>
                  {t(
                    'Your administrators reduce enemy village loyalty by up to 5% more.',
                  )}
                </Text>
              </li>
              <li>
                <Text>
                  {t(
                    'Your own villages lose up to 5% less loyalty when you are attacked.',
                  )}
                </Text>
              </li>
            </>
          )}
        </ul>
        {celebrationType === 'large' && (
          <Text>
            {t(
              'These loyalty effects apply to all battles that take place during the celebration, regardless of when troops were sent.',
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
        <Text>
          {t('{{amount}} culture points', { amount: formatNumber(reward) })}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {t('Limit')}:{' '}
          {t('{{amount}} culture points', { amount: formatNumber(limit) })}
        </Text>
      </section>
      <section className="flex flex-col gap-2">
        {activeCelebration && (
          <Text>
            {t('Town Hall ready in {{time}}', {
              time: '',
            })}
            <Countdown endsAt={activeCelebration.resolvesAt} />
          </Text>
        )}

        <Button
          size="fit"
          disabled={isDisabled}
          onClick={() => {
            createEvent({
              celebrationType,
              cachesToClearImmediately: [
                [culturePointsCacheKey],
                [currentVillageCacheKey, currentVillage.slug],
                [playersCacheKey],
              ],
            });
          }}
        >
          {t('Start celebration')}
        </Button>
        <ErrorBag
          errorBag={[
            ...(isLargeCelebrationLocked
              ? [t('Large celebrations require Town Hall level 10.')]
              : []),
            ...errorBag,
          ]}
        />
      </section>
    </article>
  );
};
