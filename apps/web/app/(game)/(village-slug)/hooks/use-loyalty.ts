import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Tile } from '@pillage-first/types/models/tile';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { loyaltyCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useLoyalty = (tileId: Tile['id'] | null = null) => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  var finalTileId = tileId;
  if (finalTileId == null) {
    finalTileId = currentVillage.tileId;
  }

  const { data: loyalty } = useSuspenseQuery({
    queryKey: [loyaltyCacheKey, finalTileId],
    queryFn: async () => {
      const { data } = await apiClient.get('/tiles/:tileId/loyalty', {
        path: {
          tileId: finalTileId,
        },
      });

      return data;
    },
  });

  return loyalty;
};
