import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { OasisTile, OccupiedOasisTile } from 'app/interfaces/models/game/tile';
import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { isOccupiableOasisTile } from 'app/(game)/(village-slug)/utils/guards/map-guards';

export const useOasis = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: occupiableOasisInRange } = useSuspenseQuery<OasisTile[]>({
    queryKey: ['occupiable-oasis-in-range', currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<OasisTile[]>(`/tiles/${currentVillage.id}/occupiable-oasis`);
      return data;
    },
  });

  // TODO: Fix this type coercion
  const oasisOccupiedByCurrentVillage = occupiableOasisInRange.filter((tile) => {
    return isOccupiableOasisTile(tile) && tile.villageId === currentVillage.id;
  }) as unknown as OccupiedOasisTile[];

  const hasOccupiedOasis = oasisOccupiedByCurrentVillage.length > 0;

  return {
    oasisOccupiedByCurrentVillage,
    hasOccupiedOasis,
    occupiableOasisInRange,
  };
};
