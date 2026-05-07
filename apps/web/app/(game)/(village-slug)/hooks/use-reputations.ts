import { useSuspenseQuery } from '@tanstack/react-query';
import { use, useCallback, useMemo } from 'react';
import type { Faction } from '@pillage-first/types/models/faction';
import type { Reputation } from '@pillage-first/types/models/reputation';
import { reputationsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useMe } from './use-me';

export const useReputations = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: reputations } = useSuspenseQuery({
    queryKey: [reputationsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/:playerId/reputations', {
        path: {
          playerId: player.id,
        },
      });

      return data;
    },
  });

  const reputationsMap = useMemo(() => {
    return new Map<Faction, Reputation>(
      reputations.map((reputation) => {
        return [reputation.faction, reputation];
      }),
    );
  }, [reputations]);

  const getReputation = useCallback(
    (faction: Faction): Reputation => {
      return reputationsMap.get(faction)!;
    },
    [reputationsMap],
  );

  return {
    reputations,
    reputationsMap,
    getReputation,
  };
};
