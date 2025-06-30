import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { prngAlea } from 'ts-seedrandom';
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
  const adventurePrng = prngAlea(`${seed}${adventureCount}`);

  // Short adventure is between 8 & 12 minutes long
  const _shortAdventureDuration =
    seededRandomIntFromInterval(adventurePrng, 8 * 60, 12 * 60) * 1000;

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Adventures')}</Text>
        <Text as="p">
          {t(
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus animi aperiam consequatur distinctio dolor dolorum, et ex fugiat ipsum labore maiores nam nihil nostrum quibusdam quis sint tempora vel veniam!',
          )}
        </Text>
      </SectionContent>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </Section>
  );
};
