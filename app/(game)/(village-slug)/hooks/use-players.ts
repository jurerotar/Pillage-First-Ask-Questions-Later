import { useQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import { nonPersistedCacheKey, playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const usePlayers = () => {
  const { data: players } = useQuery<Player[]>({
    queryKey: [playersCacheKey],
    initialData: [],
  });

  const currentPlayer = players.at(0)!;

  const getPlayersMap = () => new Map(players.map((player) => [player.id, player]));

  const { data: playersMap } = useQuery<Map<Player['id'], Player>>({
    queryKey: [nonPersistedCacheKey, players],
    queryFn: getPlayersMap,
    initialData: getPlayersMap,
    initialDataUpdatedAt: Date.now(),
    gcTime: 10_000,
    queryKeyHashFn: () => {
      const playersHash = players.map((player) => player.id).join('|');
      return `${nonPersistedCacheKey}-players-hash-[${playersHash}]`;
    },
  });

  return {
    players,
    currentPlayer,
    playersMap,
  };
};
