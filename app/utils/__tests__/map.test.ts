import { describe, expect, test } from 'vitest';
import type { Resource } from 'app/interfaces/models/game/resource';
import {
  calculateGridLayout,
  decodeGraphicsProperty,
  encodeGraphicsProperty,
  parseResourcesFromRFC,
  tileIdToCoordinates,
} from '../map';

describe('encodeGraphicsProperty and decodeGraphicsProperty', () => {
  test('encoding and decoding is reversible for all valid combinations', () => {
    const resources: Resource[] = ['wood', 'clay', 'iron', 'wheat'];

    for (const resource of resources) {
      for (let group = 0; group < 4; group += 1) {
        for (let x = 0; x < 4; x += 1) {
          for (let y = 0; y < 4; y += 1) {
            const encoded = encodeGraphicsProperty(resource, group, x, y, 0);
            const decoded = decodeGraphicsProperty(encoded);

            expect(decoded.oasisResource).toBe(resource);
            expect(decoded.oasisGroup).toBe(group);
            expect(decoded.oasisGroupPositions).toBe(`${x}-${y}`);
            expect(decoded.variant).toBe(0);
          }
        }
      }
    }
  });
});

describe('parseResourcesFromRFC', () => {
  test('parses standard resource field composition correctly', () => {
    const result = parseResourcesFromRFC('4446');
    expect(result).toEqual([4, 4, 4, 6]);
  });

  test('parses composition with double-digit wheat correctly', () => {
    const result = parseResourcesFromRFC('11115');
    expect(result).toEqual([1, 1, 1, 15]);
  });

  test('parses composition with single-digit wheat correctly', () => {
    const result = parseResourcesFromRFC('3339');
    expect(result).toEqual([3, 3, 3, 9]);
  });

  test('parses balanced resource composition', () => {
    const result = parseResourcesFromRFC('3456');
    expect(result).toEqual([3, 4, 5, 6]);
  });
});

describe('calculateGridLayout', () => {
  test('calculates grid layout for even map size', () => {
    const result = calculateGridLayout(100);

    expect(result.gridSize).toBe(105);
    expect(result.totalSize).toBe(104);
    expect(result.halfSize).toBe(52);
    expect(result.borderWidth).toBe(4);
    expect(result.totalTiles).toBe(11025);
    expect(result.mapBorderThreshold).toBe(2500);
  });

  test('calculates grid layout for odd map size', () => {
    const result = calculateGridLayout(99);

    expect(result.gridSize).toBe(105);
    expect(result.totalSize).toBe(104);
    expect(result.halfSize).toBe(52);
    expect(result.borderWidth).toBe(4);
    expect(result.totalTiles).toBe(11025);
    expect(result.mapBorderThreshold).toBe(2500);
  });

  test('calculates grid layout for small map size', () => {
    const result = calculateGridLayout(10);

    expect(result.gridSize).toBe(15);
    expect(result.totalSize).toBe(14);
    expect(result.halfSize).toBe(7);
    expect(result.borderWidth).toBe(4);
    expect(result.totalTiles).toBe(225);
    expect(result.mapBorderThreshold).toBe(25);
  });
});

describe('tileIdToCoordinates', () => {
  test('converts center tile id to (0, 0) coordinates', () => {
    const mapSize = 10;
    const { gridSize, halfSize } = calculateGridLayout(mapSize);
    // Center tile: row = halfSize, col = halfSize
    // tileId = row * gridSize + col + 1
    const centerTileId = halfSize * gridSize + halfSize + 1;

    const result = tileIdToCoordinates(centerTileId, mapSize);

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  test('converts first tile id to top-left coordinates', () => {
    const mapSize = 10;
    const { halfSize } = calculateGridLayout(mapSize);

    const result = tileIdToCoordinates(1, mapSize);

    expect(result.x).toBe(-halfSize);
    expect(result.y).toBe(halfSize);
  });

  test('converts tile id correctly for various positions', () => {
    const mapSize = 10;
    const { gridSize, halfSize } = calculateGridLayout(mapSize);

    // Top-right corner: row = 0, col = gridSize - 1
    const topRightTileId = gridSize;
    const topRight = tileIdToCoordinates(topRightTileId, mapSize);
    expect(topRight.x).toBe(halfSize);
    expect(topRight.y).toBe(halfSize);

    // Bottom-left corner: row = gridSize - 1, col = 0
    const bottomLeftTileId = (gridSize - 1) * gridSize + 1;
    const bottomLeft = tileIdToCoordinates(bottomLeftTileId, mapSize);
    expect(bottomLeft.x).toBe(-halfSize);
    expect(bottomLeft.y).toBe(-halfSize);
  });
});
