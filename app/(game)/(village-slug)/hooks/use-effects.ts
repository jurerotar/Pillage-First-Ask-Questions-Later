import { useQuery } from '@tanstack/react-query';
import type { Effect } from 'app/interfaces/models/game/effect';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useEffects = () => {
  const { data: effects } = useQuery<Effect[]>({
    queryKey: [effectsCacheKey],
    initialData: [],
  });

  return {
    effects,
  };
};
