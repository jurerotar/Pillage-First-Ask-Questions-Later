import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { database } from 'database/database';
import type { ResearchLevel } from 'interfaces/models/game/research-level';
import type { Server } from 'interfaces/models/game/server';

export const researchLevelsCacheKey = 'research-levels';

export const getResearchLevels = (serverId: Server['id']) => database.researchLevels.where({ serverId }).toArray();

export const useResearchLevels = () => {
  const { serverId } = useCurrentServer();

  const { data: researchLevels } = useQuery<ResearchLevel[]>({
    queryFn: () => getResearchLevels(serverId),
    queryKey: [researchLevelsCacheKey, serverId],
    initialData: [],
  });

  return {
    researchLevels,
  };
};
