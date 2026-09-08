import { describe, expect, test } from 'vitest';
import { TRIBES } from '@pillage-first/types/models/tribe';
import { buildings } from '../buildings';

const buildingEffectCases = buildings.flatMap(({ id, maxLevel, effects }) =>
  TRIBES.flatMap((tribe) =>
    effects(tribe).map((effect) => ({
      buildingId: id,
      tribe,
      effect,
      expectedLength: maxLevel + 1,
    })),
  ),
);

describe('building assets', () => {
  test('effects have values for each building level', () => {
    const invalidCases = [];

    for (const {
      buildingId,
      tribe,
      effect,
      expectedLength,
    } of buildingEffectCases) {
      if (effect.valuesPerLevel.length === expectedLength) {
        continue;
      }

      invalidCases.push({
        buildingId,
        tribe,
        effectId: effect.effectId,
        expectedLength,
        actualLength: effect.valuesPerLevel.length,
        valuesPerLevel: effect.valuesPerLevel,
      });
    }

    expect(invalidCases).toStrictEqual([]);
  });
});
