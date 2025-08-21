import { describe, test, expect } from 'vitest';
import { encodeGraphicsProperty, decodeGraphicsProperty } from '../map';
import type { Resource } from 'app/interfaces/models/game/resource';

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
