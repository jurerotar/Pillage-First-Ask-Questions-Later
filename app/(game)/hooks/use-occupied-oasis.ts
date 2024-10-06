import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useMap } from 'app/(game)/hooks/use-map';
import { isOccupiedOasisTile } from 'app/(game)/utils/guards/map-guards';
import { useMemo } from 'react';

export const useOccupiedOasis = () => {
  const { map } = useMap();
  const { currentVillageId } = useCurrentVillage();

  const oasisOccupiedByCurrentVillage = useMemo(() => {
    return map.filter((tile) => {
      if (!isOccupiedOasisTile(tile)) {
        return false;
      }

      return tile.villageId === currentVillageId;
    });
  }, [map, currentVillageId]);

  const hasOccupiedOasis = oasisOccupiedByCurrentVillage.length > 0;

  return {
    oasisOccupiedByCurrentVillage,
    hasOccupiedOasis,
  };
};
