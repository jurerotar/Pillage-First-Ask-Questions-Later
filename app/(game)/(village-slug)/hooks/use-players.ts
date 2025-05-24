import { useSuspenseQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import { playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const usePlayers = () => {
  const { fetcher } = use(ApiContext);

  const { data: players } = useSuspenseQuery<Player[]>({
    queryKey: [playersCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Player[]>('/players');
      return data;
    },
  });

  const currentPlayer = players.at(0)!;

  const getPlayersMap = () => new Map(players.map((player) => [player.id, player]));

  const { data: playersMap } = useSuspenseQuery<Map<Player['id'], Player>>({
    queryKey: [players],
    queryFn: getPlayersMap,
    initialData: getPlayersMap,
    initialDataUpdatedAt: Date.now(),
    gcTime: 10_000,
    queryKeyHashFn: () => {
      const playersHash = players.map((player) => player.id).join('|');
      return `players-hash-[${playersHash}]`;
    },
  });

  return {
    players,
    currentPlayer,
    playersMap,
  };
};
