import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { getParsedFileContents } from 'app/utils/opfs';
import type { Player } from 'interfaces/models/game/player';
import { useCallback } from 'react';

export const playersCacheKey = 'players';

export const usePlayers = () => {
  const { serverHandle } = useCurrentServer();

  const { data: players } = useQuery<Player[]>({
    queryFn: () => getParsedFileContents(serverHandle, 'players'),
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
