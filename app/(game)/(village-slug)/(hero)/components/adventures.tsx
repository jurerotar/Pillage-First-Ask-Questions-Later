import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { prngAlea } from 'ts-seedrandom';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { seededRandomIntFromInterval } from 'app/utils/common';
import { WarningAlert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';

export const Adventures = () => {
  const { t } = useTranslation();
  const {
    server: { seed },
  } = useServer();
  const { hero } = useHero();

  const { adventureCount } = hero;

  // We need to do it this was, so that we preserve durations
  const adventurePrng = prngAlea(`${seed}${adventureCount}`);

  // Short adventure is between 8 & 12 minutes long
  const _shortAdventureDuration = seededRandomIntFromInterval(adventurePrng, 8 * 60, 12 * 60) * 1000;

  return (
    <article className="flex flex-col gap-2">
      <Text as="h2">{t('Adventures')}</Text>
      <WarningAlert>{t('This page is still under development')}</WarningAlert>
    </article>
  );
};
