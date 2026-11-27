import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { CulturePointsCelebrationType } from '@pillage-first/types/models/celebration';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useResourceAvailability } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import { useActiveCelebration } from 'app/(game)/(village-slug)/hooks/use-active-celebration';

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
  const activeCelebration = useActiveCelebration();
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
        <Countdown endsAt={activeCelebration.endsAt} />
      </span>,
    );
  }

  return {
    errorBag,
    isDisabled:
      !!activeCelebration || isLargeCelebrationLocked || !hasEnoughResources,
  };
};
