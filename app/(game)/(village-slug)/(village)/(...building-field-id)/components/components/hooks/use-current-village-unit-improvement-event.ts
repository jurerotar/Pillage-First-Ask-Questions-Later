import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useCurrentVillageUnitImprovementEvent = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: currentVillageUnitImprovementEvent } = useSuspenseQuery<GameEvent<'unitImprovement'> | null>({
    queryKey: [eventsCacheKey, 'unit-improvement'],
    queryFn: async () => {
      const { data } = await fetcher<{ unitImprovementEvent: GameEvent<'unitImprovement'> | null }>(
        `/villages/${currentVillage.id}/events/unit-improvement`,
      );
      return data.unitImprovementEvent;
    },
  });

  return {
    currentVillageUnitImprovementEvent,
  };
};
