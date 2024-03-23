import { database } from 'database/database';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';
import { Reputation } from 'interfaces/models/game/reputation';
import { PlayerFaction } from 'interfaces/models/game/player';

export const reputationsCacheKey = 'reputations';

export const getReputations = (serverId: Server['id']) => database.reputations.where({ serverId }).toArray();

export const useReputations = () => {
  const { serverId } = useCurrentServer();

  const { data: reputations } = useQuery<Reputation[]>({
    queryFn: () => getReputations(serverId),
    queryKey: [reputationsCacheKey, serverId],
    initialData: [],
  });

  const getReputationByFaction = (faction: PlayerFaction): Reputation => {
    return reputations.find(({ faction: reputationFaction }) => faction === reputationFaction)!;
  };

  return {
    reputations,
    getReputationByFaction,
  };
};
