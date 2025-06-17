import { describe, test, expect } from 'vitest';
import {
  parseCoordinatesFromTileId,
  encodeGraphicsProperty,
  decodeGraphicsProperty,
  packTileId,
} from '../map';
import type { Resource } from 'app/interfaces/models/game/resource';

describe('Tile ID Bit-packing', () => {
  test('0,0 → packs and unpacks correctly', () => {
    const packed = packTileId(0, 0);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  test('1,2 → packs and unpacks correctly', () => {
    const packed = packTileId(1, 2);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(1);
    expect(y).toBe(2);
  });

  test('-1,-2 → packs and unpacks correctly', () => {
    const packed = packTileId(-1, -2);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(-1);
    expect(y).toBe(-2);
  });

  test('123,-456 → packs and unpacks correctly', () => {
    const packed = packTileId(123, -456);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(123);
    expect(y).toBe(-456);
  });

  test('-300,300 → packs and unpacks correctly', () => {
    const packed = packTileId(-300, 300);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(-300);
    expect(y).toBe(300);
  });

  test('32767,32767 → max 16-bit signed', () => {
    const packed = packTileId(32767, 32767);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(32767);
    expect(y).toBe(32767);
  });

  test('-32768,-32768 → min 16-bit signed', () => {
    const packed = packTileId(-32768, -32768);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(-32768);
    expect(y).toBe(-32768);
  });

  test('1024,2048 → packs and unpacks correctly', () => {
    const packed = packTileId(1024, 2048);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(1024);
    expect(y).toBe(2048);
  });

  test('-1024,-2048 → packs and unpacks correctly', () => {
    const packed = packTileId(-1024, -2048);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(-1024);
    expect(y).toBe(-2048);
  });

  test('0,-32768 → edge Y value', () => {
    const packed = packTileId(0, -32768);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(0);
    expect(y).toBe(-32768);
  });

  test('-32768,0 → edge X value', () => {
    const packed = packTileId(-32768, 0);
    const { x, y } = parseCoordinatesFromTileId(packed);
    expect(x).toBe(-32768);
    expect(y).toBe(0);
  });

  test('should not collide between distinct pairs', () => {
    const a = packTileId(123, 456);
    const b = packTileId(456, 123);
    expect(a).not.toBe(b);
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
