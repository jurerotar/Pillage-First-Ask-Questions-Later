import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import type { PlayerFaction } from 'interfaces/models/game/player';
import type { Reputation } from 'interfaces/models/game/reputation';
import { useCallback } from 'react';
import { getParsedFileContents } from 'app/utils/opfs';

export const reputationsCacheKey = 'reputations';

export const useReputations = () => {
  const { serverHandle } = useCurrentServer();

  const { data: reputations } = useQuery<Reputation[]>({
    queryFn: () => getParsedFileContents(serverHandle, 'reputations'),
    queryKey: [reputationsCacheKey],
    initialData: [],
  });

  const getReputationByFaction = useCallback(
    (faction: PlayerFaction): Reputation => {
      return reputations.find(({ faction: reputationFaction }) => faction === reputationFaction)!;
    },
    [reputations]
  );

  return {
    reputations,
    getReputationByFaction,
  };
};
