import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useCurrentVillageUnitResearchEvent = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: currentVillageUnitResearchEvent } = useSuspenseQuery<GameEvent<'unitResearch'> | null>({
    queryKey: [eventsCacheKey, 'unit-research'],
    queryFn: async () => {
      const { data } = await fetcher<{ unitResearchEvent: GameEvent<'unitResearch'> | null }>(
        `/villages/${currentVillage.id}/events/unit-research`,
      );
      return data.unitResearchEvent;
    },
  });

  return {
    currentVillageUnitResearchEvent,
  };
};
