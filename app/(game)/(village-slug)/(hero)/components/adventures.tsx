import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { prngMulberry32 } from 'ts-seedrandom';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { seededRandomIntFromInterval } from 'app/utils/common';
import { Alert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';

export const Adventures = () => {
  const { t } = useTranslation();
  const { server } = useServer();
  const { hero } = useHero();

  const seed = server!.seed;
  const { adventureCount } = hero!;

  // We need to do it this was, so that we preserve durations
  const adventurePrng = prngMulberry32(`${seed}${adventureCount}`);

  // Short adventure is between 8 & 12 minutes long
  const _shortAdventureDuration =
    seededRandomIntFromInterval(adventurePrng, 8 * 60, 12 * 60) * 1000;

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
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </Section>
  );
};
