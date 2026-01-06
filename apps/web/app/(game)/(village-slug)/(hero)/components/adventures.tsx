import { useTranslation } from 'react-i18next';
import { prngMulberry32 } from 'ts-seedrandom';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useHeroAdventures } from 'app/(game)/(village-slug)/hooks/use-hero-adventures';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';

export const Adventures = () => {
  const { t } = useTranslation();
  const { server } = useServer();
  const { available, completed } = useHeroAdventures();
  const { eventsByType } = useEventsByType('adventurePointIncrease');

  const { seed } = server;

  const adventurePrng = prngMulberry32(`${seed}${completed}`);

  // Short adventure is between 8 & 12 minutes long
  const _adventureDuration =
    seededRandomIntFromInterval(adventurePrng, 8 * 60, 12 * 60) * 1000;

  const nextAdventurePointIncreaseEvent = eventsByType.at(0)!;

  const nextAdventurePointIncreaseTimestamp =
    nextAdventurePointIncreaseEvent.startsAt +
    nextAdventurePointIncreaseEvent.duration;

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Adventures')}</Text>
        <Text>
          {t(
            'Your hero is always keen to explore, and will be happy to share his findings with you if you give him the order to go on an adventure.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Text className="font-medium">
          {t(
            'Your hero has enough adventure points for {{count}} adventures.',
            { count: available },
          )}
        </Text>
        <Text className="font-medium">
          {t('Next adventure point in: ')}
          <Countdown endsAt={nextAdventurePointIncreaseTimestamp} />
        </Text>
      </SectionContent>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </Section>
  );
};
