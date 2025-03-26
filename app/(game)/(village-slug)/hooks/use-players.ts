import { useQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import { useCallback } from 'react';
import { playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const usePlayers = () => {
  const { data: players } = useQuery<Player[]>({
    queryKey: [playersCacheKey],
    initialData: [],
  });

  const currentPlayer = players.at(0)!;

  const getPlayerByPlayerId = useCallback(
    (playerIdToSearchFor: Player['id']): Player => {
      return players.find(({ id }) => playerIdToSearchFor === id)!;
    },
    [players],
  );

  return {
    players,
    currentPlayer,
    getPlayerByPlayerId,
  };
};
