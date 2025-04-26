import { describe, expect, test } from 'vitest';
import { buildings } from 'app/(game)/(village-slug)/assets/buildings';

describe('Building assets', () => {
  test('Each building has a wheatProduction effect at index 0 of building.effects', () => {
    for (const building of buildings) {
      const firstEffect = building.effects[0];
      expect(firstEffect, `Missing effect at index 0 in ${building.id}`).toBeDefined();
      expect(firstEffect.effectId, `First effect in ${building.id} is not wheatProduction`).toBe('wheatProduction');
    }
  });

  test('The wheatProduction effect at index 0 has only 0 or negative values', () => {
    for (const building of buildings) {
      const firstEffect = building.effects[0];
      expect(Array.isArray(firstEffect.valuesPerLevel), `valuesPerLevel missing or not an array in ${building.id}`).toBe(true);

      for (const [index, value] of firstEffect.valuesPerLevel.entries()) {
        expect(value, `Value at index ${index} in ${building.id} is greater than 0`).toBeLessThanOrEqual(0);
      }
    }
  });

  test("Each building's wheatProduction effect values start with 0", () => {
    for (const building of buildings) {
      const effect = building.effects[0];
      expect(effect.valuesPerLevel[0], `First value in wheatProduction of ${building.id} is not 0`).toBe(0);
    }
  });

  test("Each building's effect values are exactly building.maxLevel + 1 long", () => {
    for (const building of buildings) {
      for (const effect of building.effects) {
        const expectedLength = building.maxLevel + 1;
        expect(
          effect.valuesPerLevel.length,
          `Effect '${effect.effectId}' in ${building.id} has incorrect length (expected ${expectedLength}, got ${effect.valuesPerLevel.length})`,
        ).toBe(expectedLength);
      }
    }
  });
});
