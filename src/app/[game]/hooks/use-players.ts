import { database } from 'database/database';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';
import { Player } from 'interfaces/models/game/player';

export const playersCacheKey = 'players';

export const getPlayers = (serverId: Server['id']) => database.players.where({ serverId }).toArray();

export const usePlayers = () => {
  const { serverId } = useCurrentServer();

  const { data: players } = useQuery<Player[]>({
    queryFn: () => getPlayers(serverId),
    queryKey: [playersCacheKey, serverId],
    initialData: [],
  });

  const playerId = players.find((player) => player.faction === 'player')!.id;

  const getPlayerByPlayerId = (playerIdToSearchFor: Player['id']): Player => {
    return players.find(({ id }) => playerIdToSearchFor === id)!;
  };

  return {
    players,
    getPlayerByPlayerId,
    playerId,
  };
};
