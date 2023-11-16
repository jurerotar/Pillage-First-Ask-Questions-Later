import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';
import { Player, PlayerFaction } from 'interfaces/models/game/player';

export const playersCacheKey = 'players';

export const getPlayers = (serverId: Server['id']) => database.players.where({ serverId }).toArray();

export const usePlayers = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutatePlayers } = useDatabaseMutation({ cacheKey: playersCacheKey });

  const {
    data: players,
    isLoading: isLoadingPlayers,
    isSuccess: hasLoadedPlayers,
    status: playersQueryStatus
  } = useAsyncLiveQuery<Player[]>({
    queryFn: () => getPlayers(serverId),
    deps: [serverId],
    fallback: [],
    cacheKey: playersCacheKey,
    enabled: hasLoadedServer
  });

  const getFactionByPlayerId = (playerId: Player['id']): PlayerFaction => {
    return players.find(({ id }) => playerId === id)?.faction!;
  };

  return {
    players,
    isLoadingPlayers,
    hasLoadedPlayers,
    playersQueryStatus,
    mutatePlayers,
    getFactionByPlayerId
  };
};
