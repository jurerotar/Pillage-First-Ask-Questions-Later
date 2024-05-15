import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { database } from 'database/database';
import type { PlayerFaction } from 'interfaces/models/game/player';
import type { Reputation } from 'interfaces/models/game/reputation';
import type { Server } from 'interfaces/models/game/server';
import { useCallback } from 'react';

export const reputationsCacheKey = 'reputations';

export const getReputations = (serverId: Server['id']) => database.reputations.where({ serverId }).toArray();

export const useReputations = () => {
  const { serverId } = useCurrentServer();

  const { data: reputations } = useQuery<Reputation[]>({
    queryFn: () => getReputations(serverId),
    queryKey: [reputationsCacheKey, serverId],
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
