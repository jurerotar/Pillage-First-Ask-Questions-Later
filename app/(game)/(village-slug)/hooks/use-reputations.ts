import { useSuspenseQuery } from '@tanstack/react-query';
import { use, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { reputationsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Faction } from 'app/interfaces/models/game/faction';
import {
  type Reputation,
  reputationSchema,
} from 'app/interfaces/models/game/reputation';

export const useReputations = () => {
  const { fetcher } = use(ApiContext);

  const { data: reputations } = useSuspenseQuery({
    queryKey: [reputationsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/reputations');

      return z.array(reputationSchema).parse(data);
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
