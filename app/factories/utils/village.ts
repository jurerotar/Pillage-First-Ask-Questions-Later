import type { VillageSize } from 'app/interfaces/models/game/village';
import type { Tile } from 'app/interfaces/models/game/tile';
import { parseCoordinatesFromTileId } from 'app/utils/map';

export const getVillageSize = (mapSize: number, tileId: Tile['id']): VillageSize => {
  // These are essentially percentage values so it works regardless of server size
  const tileDistanceToVillageSizeMap = new Map<number, VillageSize>([
    [63, '4xl'],
    [56, '3xl'],
    [49, '2xl'],
    [42, 'xl'],
    [35, 'lg'],
    [28, 'md'],
    [21, 'sm'],
    [14, 'xs'],
    [7, 'xxs'],
  ]);

  const { x, y } = parseCoordinatesFromTileId(tileId);
  const relativeDistance = Math.floor((Math.sqrt(x ** 2 + y ** 2) / mapSize) * 100);

  for (const [key, size] of tileDistanceToVillageSizeMap) {
    if (relativeDistance >= key) {
      return size;
    }
  }

  return 'xs';
};
