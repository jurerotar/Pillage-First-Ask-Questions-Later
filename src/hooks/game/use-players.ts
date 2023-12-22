import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';
import { Player, PlayerFaction } from 'interfaces/models/game/player';

export const playersCacheKey = 'players';

export const getPlayers = (serverId: Server['id']) => database.players.where({ serverId }).toArray();

export const usePlayers = () => {
  const { serverId } = useCurrentServer();

  const {
    data: players,
    isLoading: isLoadingPlayers,
    isSuccess: hasLoadedPlayers,
    status: playersQueryStatus,
  } = useQuery<Player[]>({
    queryFn: () => getPlayers(serverId),
    queryKey: [playersCacheKey, serverId],
    initialData: [],
  });

  const playerId = players.find((player) => player.faction === 'player')!.id;

  const getFactionByPlayerId = (playerIdToSearchFor: Player['id']): PlayerFaction => {
    return players.find(({ id }) => playerIdToSearchFor === id)!.faction!;
  };

  return {
    players,
    isLoadingPlayers,
    hasLoadedPlayers,
    playersQueryStatus,
    getFactionByPlayerId,
    playerId,
  };
};
