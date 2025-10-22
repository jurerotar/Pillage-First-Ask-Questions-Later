import { useSuspenseQuery } from '@tanstack/react-query';
import type { Faction } from 'app/interfaces/models/game/faction';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import { reputationsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useReputations = () => {
  const { fetcher } = use(ApiContext);

  const { data: reputations } = useSuspenseQuery({
    queryKey: [reputationsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Reputation[]>('/me/reputations');
      return data;
    },
  });

  const getReputationsMap = () =>
    new Map(reputations.map((reputation) => [reputation.faction, reputation]));

  const { data: reputationsMap } = useSuspenseQuery<Map<Faction, Reputation>>({
    queryKey: [reputations],
    queryFn: getReputationsMap,
    initialData: getReputationsMap,
    initialDataUpdatedAt: Date.now(),
    gcTime: 10_000,
    queryKeyHashFn: () => {
      const reputationsHash = reputations
        .map(
          (reputation) => `${reputation.faction}-${reputation.reputationLevel}`,
        )
        .join('|');
      return `reputation-hash-[${reputationsHash}]`;
    },
  });

  return {
    reputations,
    reputationsMap,
  };
};
