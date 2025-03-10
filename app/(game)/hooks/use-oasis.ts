import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useMap } from 'app/(game)/hooks/use-map';
import { isOccupiableOasisTile, isOccupiedOasisTile } from 'app/(game)/utils/guards/map-guards';
import type { OasisTile, OccupiedOasisTile } from 'app/interfaces/models/game/tile';
import { use } from 'react';
import { parseCoordinatesFromTileId } from 'app/utils/map-tile';

export const useOasis = () => {
  const { map } = useMap();
  const { currentVillage } = use(CurrentVillageContext);

  const oasisOccupiedByCurrentVillage: OccupiedOasisTile[] = map.filter((tile) => {
    if (!isOccupiedOasisTile(tile)) {
      return false;
    }

    return tile.villageId === currentVillage.id;
  }) as OccupiedOasisTile[];

  const oasisTilesInRange: OasisTile[] = map.filter((tile) => {
    if (!isOccupiableOasisTile(tile)) {
      return false;
    }

    const villageCoordinates = parseCoordinatesFromTileId(currentVillage.id);
    const tileCoordinates = parseCoordinatesFromTileId(tile.id);

    const distanceX = (villageCoordinates.x - tileCoordinates.x) ** 2;
    const distanceY = Math.abs(villageCoordinates.y - tileCoordinates.y) ** 2;
    const distance = Math.sqrt(distanceX + distanceY);

    return distance <= 4.5;
  }) as OasisTile[];

  const hasOccupiedOasis = oasisOccupiedByCurrentVillage.length > 0;

  return {
    oasisOccupiedByCurrentVillage,
    hasOccupiedOasis,
    oasisTilesInRange,
  };
};
