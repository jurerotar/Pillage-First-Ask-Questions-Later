import { useQuery } from '@tanstack/react-query';
import type { PlayerFaction } from 'app/interfaces/models/game/player';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import { useCallback } from 'react';

export const reputationsCacheKey = 'reputations';

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
