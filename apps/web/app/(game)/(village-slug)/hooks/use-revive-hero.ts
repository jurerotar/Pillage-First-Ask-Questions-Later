import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import {
  currentVillageCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';

export const useReviveHero = () => {
  const { currentVillage } = useCurrentVillage();
  const { createEvent: createHeroRevivalEvent } = useCreateEvent('heroRevival');

  const reviveHero = () => {
    createHeroRevivalEvent({
      cachesToClearImmediately: [
        [currentVillageCacheKey, currentVillage.slug],
        [eventsCacheKey, 'heroRevival', currentVillage.id],
      ],
    });
  };

  return {
    reviveHero,
  };
};
