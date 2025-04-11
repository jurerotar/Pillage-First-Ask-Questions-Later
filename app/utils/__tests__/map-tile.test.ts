import { describe, test, expect } from 'vitest';
import { parseCoordinatesFromTileId, encodeGraphicsProperty, decodeGraphicsProperty } from '../map-tile';
import type { Resource } from 'app/interfaces/models/game/resource';

describe('parseCoordinatesFromTileId', () => {
  test('correctly parses valid tile id', () => {
    const tileId = '10|15';
    const result = parseCoordinatesFromTileId(tileId);
    expect(result).toEqual({ x: 10, y: 15 });
  });

  test('parses negative coordinates', () => {
    const tileId = '-5|-12';
    const result = parseCoordinatesFromTileId(tileId);
    expect(result).toEqual({ x: -5, y: -12 });
  });

  test('parses zero coordinates', () => {
    const tileId = '0|0';
    const result = parseCoordinatesFromTileId(tileId);
    expect(result).toEqual({ x: 0, y: 0 });
  });
});

describe('encodeGraphicsProperty and decodeGraphicsProperty', () => {
  test('encoding and decoding is reversible for all valid combinations', () => {
    const resources: Resource[] = ['wood', 'clay', 'iron', 'wheat'];

    for (const resource of resources) {
      for (let group = 0; group < 4; group++) {
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            const encoded = encodeGraphicsProperty(resource, group, x, y);
            const decoded = decodeGraphicsProperty(encoded);

            expect(decoded.oasisResource).toBe(resource);
            expect(decoded.oasisGroup).toBe(group);
            expect(decoded.oasisGroupPositions).toBe(`${x}-${y}`);
          }
        }
      }
    }
  });

  test('encoded values are within 0-255 range', () => {
    const encoded = encodeGraphicsProperty('wood', 3, 3, 3);
    expect(encoded).toBeGreaterThanOrEqual(0);
    expect(encoded).toBeLessThanOrEqual(255);
  });
});
