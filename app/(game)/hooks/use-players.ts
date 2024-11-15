import { useQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import { useCallback } from 'react';
import { playersCacheKey } from 'app/query-keys';

export const usePlayers = () => {
  const { data: players } = useQuery<Player[]>({
    queryKey: [playersCacheKey],
    initialData: [],
  });

  const playerId = players.find((player) => player.faction === 'player')!.id;

  const getPlayerByPlayerId = useCallback(
    (playerIdToSearchFor: Player['id']): Player => {
      return players.find(({ id }) => playerIdToSearchFor === id)!;
    },
    [players],
  );

  return {
    players,
    getPlayerByPlayerId,
    playerId,
  };
};
