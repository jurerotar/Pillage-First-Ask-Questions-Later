import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { database } from 'database/database';
import type { Player } from 'interfaces/models/game/player';
import type { Server } from 'interfaces/models/game/server';
import { useCallback } from 'react';

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

  const getPlayerByPlayerId = useCallback(
    (playerIdToSearchFor: Player['id']): Player => {
      return players.find(({ id }) => playerIdToSearchFor === id)!;
    },
    [players]
  );

  return {
    players,
    getPlayerByPlayerId,
    playerId,
  };
};
