import { useTranslation } from 'react-i18next';
import { prngMulberry32 } from 'ts-seedrandom';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';
import { AdventuresActionsErrorBag } from 'app/(game)/(village-slug)/(hero)/components/components/adventures-actions-error-bag.tsx';
import { useAdventuresActionsErrorBag } from 'app/(game)/(village-slug)/(hero)/components/hooks/use-adventures-actions-error-bag.ts';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useHeroAdventures } from 'app/(game)/(village-slug)/hooks/use-hero-adventures';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { formatTime } from 'app/utils/time';

export const Adventures = () => {
  const { t } = useTranslation();
  const { server } = useServer();
  const { available, completed } = useHeroAdventures();
  const { eventsByType } = useEventsByType('adventurePointIncrease');
  const { sendTroops } = useVillageTroops();
  const { currentVillage } = useCurrentVillage();
  const { errorBag } = useAdventuresActionsErrorBag();

  const canStartAdventure = errorBag.length === 0;

  const { seed } = server;

  const adventurePrng = prngMulberry32(`${seed}${completed}`);

  const adventureDuration =
    seededRandomIntFromInterval(adventurePrng, 8 * 60, 12 * 60) * 1000;

  const nextAdventurePointIncreaseEvent = eventsByType.at(0)!;

  const nextAdventurePointIncreaseTimestamp =
    nextAdventurePointIncreaseEvent.startsAt +
    nextAdventurePointIncreaseEvent.duration;

  const handleStartAdventure = () => {
    sendTroops({
      movementType: 'adventure',
      // This doesn't matter for adventures
      targetId: currentVillage.tileId,
      troops: [
        {
          unitId: 'HERO',
          amount: 1,
          tileId: currentVillage.tileId,
          source: currentVillage.tileId,
        },
      ],
    });
  };

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Adventure')}</Text>
        <Text>
          {t(
            'Your hero is always keen to explore, and will be happy to share his findings with you if you give him the order to go on an adventure.',
          )}
          <br />
          {completed === 0
            ? t('Your hero has not completed any adventures yet.')
            : t('Your hero has already completed {{count}} adventures.', {
                count: completed,
              })}
        </Text>
      </SectionContent>
      <SectionContent>
        <Text className="font-medium">
          {t(
            'You have enough adventure points for {{count}} adventures. You will receive your next adventure point in ',
            { count: available },
          )}
          <Countdown endsAt={nextAdventurePointIncreaseTimestamp} />.
        </Text>
        <Text className="font-medium">
          {t('You estimate next adventure will take {{duration}}.', {
            duration: formatTime(adventureDuration),
          })}
        </Text>
      </SectionContent>
      <SectionContent>
        <AdventuresActionsErrorBag errorBag={errorBag} />
        <Button
          disabled={!canStartAdventure}
          onClick={handleStartAdventure}
          size="fit"
        >
          {t('Start adventure')}
        </Button>
      </SectionContent>
    </Section>
  );
};
