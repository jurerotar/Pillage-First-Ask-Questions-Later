import { useQuery } from '@tanstack/react-query';
import type { PlayerFaction } from 'app/interfaces/models/game/player';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import { nonPersistedCacheKey, reputationsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useReputations = () => {
  const { data: reputations } = useQuery<Reputation[]>({
    queryKey: [reputationsCacheKey],
    initialData: [],
  });

  const getReputationsMap = () => new Map(reputations.map((reputation) => [reputation.faction, reputation]));

  const { data: reputationsMap } = useQuery<Map<PlayerFaction, Reputation>>({
    queryKey: [nonPersistedCacheKey, reputations],
    queryFn: getReputationsMap,
    initialData: getReputationsMap,
    initialDataUpdatedAt: Date.now(),
    gcTime: 10_000,
    queryKeyHashFn: () => {
      const reputationsHash = reputations.map((reputation) => `${reputation.faction}-${reputation.reputationLevel}`).join('|');
      return `${nonPersistedCacheKey}-reputation-hash-[${reputationsHash}]`;
    },
  });

  return {
    reputations,
    reputationsMap,
  };
};
