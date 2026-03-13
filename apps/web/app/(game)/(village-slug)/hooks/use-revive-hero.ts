import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import {
  currentVillageCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';

export const useReviveHero = () => {
  const { createEvent: createHeroRevivalEvent } = useCreateEvent('heroRevival');

  const reviveHero = () => {
    createHeroRevivalEvent({
      cachesToClearImmediately: [currentVillageCacheKey, eventsCacheKey],
    });
  };

  return {
    reviveHero,
  };
};
