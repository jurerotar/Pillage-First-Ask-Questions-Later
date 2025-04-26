import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { prngAlea } from 'ts-seedrandom';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { seededRandomIntFromInterval } from 'app/utils/common';

export const Adventures = () => {
  const {
    server: { seed },
  } = useServer();
  const { hero } = useHero();

  const { adventureCount } = hero;

  // We need to do it this was, so that we preserve durations
  const adventurePrng = prngAlea(`${seed}${adventureCount}`);

  // Short adventure is between 8 & 12 minutes long
  const _shortAdventureDuration = seededRandomIntFromInterval(adventurePrng, 8 * 60, 12 * 60) * 1000;

  return <p>Adventures</p>;
};
