import { describe, expect, test } from 'vitest';
import { buildings } from '../buildings';

describe('Building assets', () => {
  test("Each building's effect values are exactly building.maxLevel + 1 long", () => {
    for (const building of buildings) {
      for (const effect of building.effects) {
        const expectedLength = building.maxLevel + 1;
        expect(
          effect.valuesPerLevel,
          `Effect '${effect.effectId}' in ${building.id} has incorrect length (expected ${expectedLength}, got ${effect.valuesPerLevel.toString()})`,
        ).toHaveLength(expectedLength);
      }
    }
  });
});
