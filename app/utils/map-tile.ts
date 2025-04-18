import type { OccupiableTile, Tile } from 'app/interfaces/models/game/tile';
import type { Point } from 'app/interfaces/models/common';
import type { Resource } from 'app/interfaces/models/game/resource';

export const parseCoordinatesFromTileId = (tileId: Tile['id']): Point => {
  const [stringX, stringY] = tileId.split('|');
  const [x, y] = [Number.parseInt(stringX), Number.parseInt(stringY)];

  return {
    x,
    y,
  };
};

export function parseRFCFromTile(RFC: OccupiableTile['RFC'], as: 'number'): number[];
export function parseRFCFromTile(RFC: OccupiableTile['RFC'], as?: 'string'): string[];
export function parseRFCFromTile(RFC: OccupiableTile['RFC'], as: 'string' | 'number' = 'string') {
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

const idToResource = new Map(Array.from(resourceToId.entries()).map(([key, value]) => [value, key]));

export const encodeGraphicsProperty = (resource: Resource, group: number, x: number, y: number): number => {
  const resId = resourceToId.get(resource)!; // 2 bits
  return (resId << 8) | (group << 5) | (x << 3) | y;
};

export const decodeGraphicsProperty = (encoded: number) => {
  const oasisResourceId = (encoded >> 8) & 0b11;
  const oasisResource = idToResource.get(oasisResourceId);
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
