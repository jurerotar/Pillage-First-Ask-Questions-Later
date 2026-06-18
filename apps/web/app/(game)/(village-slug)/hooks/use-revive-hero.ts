import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { currentVillageCacheKey } from 'app/(game)/constants/query-keys';

export const useReviveHero = () => {
  const { currentVillage } = useCurrentVillage();
  const { createEvent: createHeroRevivalEvent } = useCreateEvent('heroRevival');

  const reviveHero = () => {
    createHeroRevivalEvent({
      cachesToClearImmediately: [[currentVillageCacheKey, currentVillage.slug]],
    });
  };

  return {
    reviveHero,
  };
};
