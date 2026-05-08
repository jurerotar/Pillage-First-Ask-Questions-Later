import { useTranslation } from 'react-i18next';
import { calculateLoyaltyIncreaseEventDuration } from '@pillage-first/game-assets/utils/loyalty';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { Text } from 'app/components/text';

type ResidenceLoyaltyCountdownProps = {
  loyalty: number;
};

export const ResidenceLoyaltyCountdown = ({
  loyalty,
}: ResidenceLoyaltyCountdownProps) => {
  const { t } = useTranslation();
  const { server } = useServer();
  const currentTime = useCountdown();

  if (loyalty >= 100) {
    return null;
  }

  const loyaltyIncreaseDuration = calculateLoyaltyIncreaseEventDuration(
    server.configuration.speed,
  );
  const elapsedSinceServerStart = currentTime - server.createdAt;
  const timeUntilNextIncrease =
    (loyaltyIncreaseDuration -
      (elapsedSinceServerStart % loyaltyIncreaseDuration)) %
    loyaltyIncreaseDuration;
  const nextLoyaltyIncreaseTimestamp =
    currentTime + (timeUntilNextIncrease || loyaltyIncreaseDuration);

  return (
    <Text>
      {t('Next increase in:')}{' '}
      <Countdown endsAt={nextLoyaltyIncreaseTimestamp} />
    </Text>
  );
};
