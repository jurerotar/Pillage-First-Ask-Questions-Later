import { useSuspenseQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Village } from 'app/interfaces/models/game/village';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

type PopulatedPlayer = {
  player: Player;
  reputation: Reputation;
  villages: Village[];
  population: number;
};

export const useStatistics = () => {
  const { fetcher } = use(ApiContext);

  const { data: statistics } = useSuspenseQuery<PopulatedPlayer[]>({
    queryKey: ['statistics'],
    queryFn: async () => {
      const { data } = await fetcher<PopulatedPlayer[]>('/statistics');
      return data;
    },
  });

  return statistics;
};
