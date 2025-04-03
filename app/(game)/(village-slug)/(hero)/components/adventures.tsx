import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { prngAlea } from 'ts-seedrandom';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { seededRandomIntFromInterval } from 'app/utils/common';

export const Adventures = () => {
  const { server: { seed } } = useServer();
  const { hero } = useHero();

  const { short: shortAdventureCount, long: longAdventureCount } = hero.adventures;

  // We need to do it this was, so that we preserve durations
  const shortAdventurePrng = prngAlea(`${seed}${shortAdventureCount}`);
  const longAdventurePrng = prngAlea(`${seed}${longAdventureCount}`);

  // Short adventure is between 8 & 12 min long
  const _shortAdventureDuration = seededRandomIntFromInterval(shortAdventurePrng, 8 * 60, 12 * 60) * 1000;
  // Long adventure is between 55 & 65 min long
  const _longAdventureDuration = seededRandomIntFromInterval(longAdventurePrng, 55 * 60, 65 * 60) * 1000;

  return (
    <p>Adventures</p>
  );
};
