import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useMap } from 'app/(game)/hooks/use-map';
import { isOccupiableOasisTile, isOccupiedOasisTile } from 'app/(game)/utils/guards/map-guards';
import type { OccupiableOasisTile, OccupiedOasisTile } from 'app/interfaces/models/game/tile';

export const useOasis = () => {
  const { map } = useMap();
  const { currentVillageId, currentVillage } = useCurrentVillage();

  const oasisOccupiedByCurrentVillage: OccupiedOasisTile[] = map.filter((tile) => {
    if (!isOccupiedOasisTile(tile)) {
      return false;
    }

    return tile.villageId === currentVillageId;
  }) as OccupiedOasisTile[];

  const oasisTilesInRange: OccupiableOasisTile[] = map.filter((tile) => {
    if (!isOccupiableOasisTile(tile)) {
      return false;
    }

    const distanceX = (currentVillage.coordinates.x - tile.coordinates.x) ** 2;
    const distanceY = Math.abs(currentVillage.coordinates.y - tile.coordinates.y) ** 2;
    const distance = Math.sqrt(distanceX + distanceY);

    return distance <= 4.5;
  }) as OccupiableOasisTile[];

  const hasOccupiedOasis = oasisOccupiedByCurrentVillage.length > 0;

  return {
    oasisOccupiedByCurrentVillage,
    hasOccupiedOasis,
    oasisTilesInRange,
  };
};
