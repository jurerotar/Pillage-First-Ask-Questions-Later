import type { VillageSize } from 'app/interfaces/models/game/village';
import type { Tile } from 'app/interfaces/models/game/tile';
import { parseCoordinatesFromTileId } from 'app/utils/map';

const buildVillageSizeLookup = (): VillageSize[] => {
  const bands: VillageSize[] = [
    'xxs', // 0–9
    'xs', // 10–19
    'sm', // 20–29
    'md', // 30–39
    'lg', // 40–49
    'xl', // 50–59
    '2xl', // 60–69
    '3xl', // 70–79
    '4xl', // 80–89
    '4xl', // 90–100 (larger outer band)
  ];

  const result: VillageSize[] = [];

  for (let i = 0; i <= 100; i++) {
    const bandIndex = Math.min(Math.floor(i / 10), bands.length - 1);
    result[i] = bands[bandIndex];
  }

  return result;
};

const villageSizeLookup = buildVillageSizeLookup();

export const getVillageSize = (
  mapSize: number,
  tileId: Tile['id'],
): VillageSize => {
  const { x, y } = parseCoordinatesFromTileId(tileId);
  const relativeDistance = Math.floor(
    (Math.sqrt(x ** 2 + y ** 2) / mapSize) * 100,
  );

  return villageSizeLookup[relativeDistance];
};
