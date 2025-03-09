import { useQuery } from '@tanstack/react-query';
import { worldItemsCacheKey } from 'app/(game)/constants/query-keys';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

export const useWorldItems = () => {
  const { data: worldItems } = useQuery<WorldItem[]>({
    queryKey: [worldItemsCacheKey],
    initialData: [],
  });

  return {
    worldItems,
  };
};
