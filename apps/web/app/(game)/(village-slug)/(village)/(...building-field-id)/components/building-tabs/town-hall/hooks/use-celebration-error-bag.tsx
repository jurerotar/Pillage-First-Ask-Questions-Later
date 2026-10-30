import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { CulturePointsCelebrationType } from '@pillage-first/game-assets/utils/culture-points';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useResourceAvailability } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';

type UseCelebrationErrorBagArgs = {
  celebrationType: CulturePointsCelebrationType;
  townHallLevel: number;
  cost: number[];
};

export const useCelebrationErrorBag = ({
  celebrationType,
  townHallLevel,
  cost,
}: UseCelebrationErrorBagArgs) => {
  const { t } = useTranslation();
  const { hasEnoughResources, errorBag: resourceErrors } =
    useResourceAvailability(cost);
  const { eventsByType: celebrationEvents } = useEventsByType(
    'culturePointsCelebration',
  );

  const activeCelebration = celebrationEvents[0];
  const isLargeCelebrationLocked =
    celebrationType === 'large' && townHallLevel < 10;

  const errorBag: ReactNode[] = [];

  if (isLargeCelebrationLocked) {
    errorBag.push(t('Large celebrations require Town Hall level 10.'));
  }

  errorBag.push(...resourceErrors);

  if (activeCelebration) {
    errorBag.push(
      <span key="celebration-cooldown">
        {t('Another celebration can start in')}{' '}
        <Countdown endsAt={activeCelebration.resolvesAt} />
      </span>,
    );
  }

  return {
    errorBag,
    isDisabled:
      !!activeCelebration || isLargeCelebrationLocked || !hasEnoughResources,
  };
};
