import { useQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import { useCallback } from 'react';
import { playersCacheKey } from 'app/(game)/constants/query-keys';

export const usePlayers = () => {
  const { data: players } = useQuery<Player[]>({
    queryKey: [playersCacheKey],
    initialData: [],
  });

  const getPlayerByPlayerId = useCallback(
    (playerIdToSearchFor: Player['id']): Player => {
      return players.find(({ id }) => playerIdToSearchFor === id)!;
    },
    [players],
  );

  const getCurrentPlayer = (): Player => {
    return players.find((player) => player.faction === 'player')!;
  };

  return {
    players,
    getPlayerByPlayerId,
    getCurrentPlayer,
  };
};
