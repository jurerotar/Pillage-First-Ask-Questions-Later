import { useQuery } from '@tanstack/react-query';
import type { PlayerFaction } from 'app/interfaces/models/game/player';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import { useCallback } from 'react';
import { reputationsCacheKey } from 'app/query-keys';

export const useReputations = () => {
  const { data: reputations } = useQuery<Reputation[]>({
    queryKey: [reputationsCacheKey],
    initialData: [],
  });

  const getReputationByFaction = useCallback(
    (faction: PlayerFaction): Reputation => {
      return reputations.find(({ faction: reputationFaction }) => faction === reputationFaction)!;
    },
    [reputations],
  );

  return {
    reputations,
    getReputationByFaction,
  };
};
