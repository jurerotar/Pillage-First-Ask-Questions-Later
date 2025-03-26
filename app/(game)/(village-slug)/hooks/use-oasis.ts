import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useMap } from 'app/(game)/(village-slug)/hooks/use-map';
import { isOccupiableOasisTile, isOccupiedOasisTile } from 'app/(game)/(village-slug)/utils/guards/map-guards';
import type { OasisTile, OccupiedOasisTile } from 'app/interfaces/models/game/tile';
import { parseCoordinatesFromTileId } from 'app/utils/map-tile';

export const useOasis = () => {
  const { map } = useMap();
  const { currentVillage } = useCurrentVillage();

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
