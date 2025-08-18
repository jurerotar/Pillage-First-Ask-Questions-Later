import type { OccupiableTile, Tile } from 'app/interfaces/models/game/tile';
import type { Point } from 'app/interfaces/models/common';
import type { Resource } from 'app/interfaces/models/game/resource';

export const packTileId = (x: number, y: number): Tile['id'] => {
  return (x << 16) | (y & 0xffff);
};

export const parseCoordinatesFromTileId = (tileId: Tile['id']): Point => {
  const x = tileId >> 16;
  const y = (tileId << 16) >> 16;
  return {
    x,
    y,
  };
};

export function parseRFCFromTile(
  RFC: OccupiableTile['RFC'],
  as: 'number',
): number[];
export function parseRFCFromTile(
  RFC: OccupiableTile['RFC'],
  as?: 'string',
): string[];
export function parseRFCFromTile(
  RFC: OccupiableTile['RFC'],
  as: 'string' | 'number' = 'string',
) {
  const [wood, clay, iron, ...wheat] = RFC.split('');
  const values = [wood, clay, iron, wheat.join('')];

  if (as === 'number') {
    return values.map((value) => Number.parseInt(value));
  }

  return values;
}

// Should only be used for bit-packing bellow
const resourceToId = new Map<Resource, number>([
  ['wood', 0],
  ['clay', 1],
  ['iron', 2],
  ['wheat', 3],
]);

const idToResource = new Map(
  Array.from(resourceToId.entries()).map(([key, value]) => [value, key]),
);

export const encodeGraphicsProperty = (
  resource: Resource,
  group: number,
  x: number,
  y: number,
): number => {
  const resId = resourceToId.get(resource)!; // 2 bits
  return (resId << 8) | (group << 5) | (x << 3) | y;
};

export const decodeGraphicsProperty = (encoded: number) => {
  const oasisResourceId = (encoded >> 8) & 0b11;
  const oasisResource = idToResource.get(oasisResourceId)!;
  const oasisGroup = (encoded >> 5) & 0b111;
  const oasisGroupPositionX = (encoded >> 3) & 0b11;
  const oasisGroupPositionY = encoded & 0b111;
  const oasisGroupPositions = `${oasisGroupPositionX}-${oasisGroupPositionY}`;

  return {
    oasisResource,
    oasisGroup,
    oasisGroupPositions,
  };
};

export const calculateGridLayout = (mapSize: number) => {
  // Extra padding added around the playable map (in tile units)
  const borderWidth = 4;

  // Make sure it's even for symmetric rendering
  const evenRaw = mapSize % 2 === 0 ? mapSize : mapSize + 1;

  // Full logical grid size (excluding +1 for tile center alignment)
  const totalSize = evenRaw + borderWidth;
  // Final size used for rendering; ensures central tile (0,0) is always present
  const gridSize = totalSize + 1;
  const halfSize = Math.floor(totalSize / 2);

  const totalTiles = gridSize ** 2;

  return {
    gridSize,
    totalSize,
    halfSize,
    borderWidth,
    totalTiles,
  };
};
