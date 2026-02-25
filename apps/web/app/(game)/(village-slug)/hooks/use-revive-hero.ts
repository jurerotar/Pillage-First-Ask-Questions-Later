import {
  eventsCacheKey,
  playerVillagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';

export const useReviveHero = () => {
  const { createEvent: createHeroRevivalEvent } = useCreateEvent('heroRevival');

  const reviveHero = () => {
    createHeroRevivalEvent({
      cachesToClearImmediately: [playerVillagesCacheKey, eventsCacheKey],
    });
  };

  return {
    reviveHero,
  };
};
