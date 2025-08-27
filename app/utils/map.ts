import type { OccupiableTile } from 'app/interfaces/models/game/tile';
import type { Resource } from 'app/interfaces/models/game/resource';

export const parseRFCFromTile = (RFC: OccupiableTile['RFC']) => {
  const [wood, clay, iron, ...wheat] = RFC.split('');
  const values = [wood, clay, iron, wheat.join('')];

  return values.map((value) => Number.parseInt(value, 10));
};

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
  group: number, // 0–7 (3 bits)
  x: number, // 0–3 (2 bits)
  y: number, // 0–7 (3 bits)
  variant: number, // 0–9 (needs 4 bits, but we allow 0–15)
): number => {
  const resId = resourceToId.get(resource)!; // 2 bits

  return (resId << 12) | (group << 9) | (x << 7) | (y << 4) | variant;
};

export const decodeGraphicsProperty = (encoded: number) => {
  const variant = encoded & 0b1111; // 4 bits
  const oasisGroupPositionY = (encoded >> 4) & 0b111; // 3 bits
  const oasisGroupPositionX = (encoded >> 7) & 0b11; // 2 bits
  const oasisGroup = (encoded >> 9) & 0b111; // 3 bits
  const oasisResourceId = (encoded >> 12) & 0b11; // 2 bits

  const oasisResource = idToResource.get(oasisResourceId);
  const oasisGroupPositions = `${oasisGroupPositionX}-${oasisGroupPositionY}`;

  return {
    oasisResource,
    oasisGroup,
    oasisGroupPositions,
    variant,
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
